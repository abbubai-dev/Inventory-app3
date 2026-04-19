import path from "node:path";
import compression from "compression";
import express from "express";
import axios from "axios";
import * as jose from "jose";
import multer, { memoryStorage } from "multer";
import pdf from "pdf-parse";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

import jwtAuth from "./middleware/jwtAuth";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3000;
const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

if (!GOOGLE_URL) {
	logger.fatal("Missing GOOGLE_SCRIPT_URL environment variable. Exiting");
	process.exit(1);
}

const app = express();
const upload = multer({ storage: memoryStorage() });

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Login routes
app.get("/api/getusers", async (_req, res) => {
	logger.info("Received getusers request");

	const { data: allUsers } = await axios.get(
		`${GOOGLE_URL}?action=getLoginData`,
	);

	const toSendToFrontend = {
		users: allUsers.users.map((user) => ({
			username: user.username,
			location: user.location,
		})),
		locations: allUsers.locations,
	};

	res.json(toSendToFrontend);
});

app.post("/api/login", async (req, res) => {
    logger.info("Received login request:", req.body);
    const { username, password, selectedLoc } = req.body;

    if (!username || !password || !selectedLoc)
        return res.status(400).json({ error: "Bad Request" });

    const { data: loginData } = await axios.get(`${GOOGLE_URL}?action=getLoginData`);
    const currentUser = loginData.users.find((user) => user.username === username);

    if (!currentUser) return res.status(404).json({ error: "Not Found" });

    // Inform Google of the login attempt
    await axios.get(`${GOOGLE_URL}?action=login&user=${currentUser.username}&pass=${password}&loc=${selectedLoc}`);

    // ✅ BYPASS: Only send OTP if the role is Clinic
    const isClinic = currentUser.role === "Clinic";
    if (isClinic) {
        await axios.get(
            `${GOOGLE_URL}?action=sendOTP&user=${encodeURIComponent(currentUser.username)}&email=${encodeURIComponent(currentUser.email)}`
        );
    }

    // We send a flag 'otpSkipped' so the frontend knows whether to show the OTP screen
    res.json({ success: true, otpSkipped: !isClinic });
});

app.post("/api/verifyotp", async (req, res) => {
    const { username, otp } = req.body;

    const { data: loginData } = await axios.get(`${GOOGLE_URL}?action=getLoginData`);
    const currentUser = loginData.users.find((u) => u.username === username);

    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    // ✅ BYPASS: Only verify OTP for Clinics
    if (currentUser.role === "Clinic") {
        const { data: otpResult } = await axios.get(
            `${GOOGLE_URL}?action=verifyOTP&email=${encodeURIComponent(currentUser.email)}&otp=${otp}`
        );

        if (!otpResult || otpResult.status === "error" || otpResult.success === false) {
            return res.status(401).json({ error: "Invalid OTP" });
        }
    }

    // Create user object and JWT
    const user = {
        username: currentUser.username,
        role: currentUser.role,
        location: currentUser.location,
    };

    const token = await new jose.SignJWT(user)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("9h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    res.json({ success: true, token, user });
});

// Auth routes
app.get("/api/whoami", jwtAuth, async (req, res) => {
	logger.info("Received whoami request");

	res.json(req.user);
});

// Warehouse & Clinic routes
app.post("/api/checkout", jwtAuth, async (req, res) => {
	logger.info("Received checkout request", req.body);

	if (req.user.role !== "Warehouse" && req.user.role !== "Clinic")
		return res.status(403).json({ error: "Forbidden" });

	const { data: checkoutResponse } = await axios.post(
		`${GOOGLE_URL}`,
		req.body,
	);

	res.json(checkoutResponse);
});

// Admin routes
app.get("/api/getfullusers", jwtAuth, async (req, res) => {
	logger.info("Received getfullusers request");

	if (req.user.role !== "Admin")
		return res.status(403).json({ error: "Forbidden" });

	const { data: allUsers } = await axios.get(
		`${GOOGLE_URL}?action=getLoginData`,
	);

	res.json(allUsers.users);
});
app.get("/api/adduser", jwtAuth, async (req, res) => {
	logger.info("Received adduser request");

	if (req.user.role !== "Admin")
		return res.status(403).json({ error: "Forbidden" });

	await axios.post(`${GOOGLE_URL}`, req.body);

	res.json({ success: true });
});

// Clinic routes
app.post("/api/clinicaction", jwtAuth, async (req, res) => {
    logger.info(`Received ${req.body.action} request`);

    if (req.user.role !== "Clinic") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const response = await axios.post(GOOGLE_URL, req.body);

        //send only response.data
        res.json(response.data);
    } catch (error) {
        logger.error("Proxy Error:", error.message); // use logger instead.check in app.log
        res.status(500).json({
            status: "error",
            message: "Google Connection Failed"
        });
    }
});


app.post("/api/processreceipt", jwtAuth, upload.single("invoice"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        const data = new Uint8Array(req.file.buffer);
        
        // Disable font face to prevent the 'standardFontDataUrl' warning/error
        const loadingTask = pdfjsLib.getDocument({ 
            data, 
            disableFontFace: true, 
            verbosity: 0 
        });
        const pdf = await loadingTask.promise;
        
        let results = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // 1. Group items by their Y-coordinate (Row alignment)
            const rows = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                // Use a 5-pixel tolerance for rows that aren't perfectly straight
                const rowKey = Object.keys(rows).find(key => Math.abs(key - y) <= 5) || y;
                if (!rows[rowKey]) rows[rowKey] = [];
                rows[rowKey].push({
                    str: item.str.trim(),
                    x: item.transform[4]
                });
            });

            const QTY_X_THRESHOLD = 450; // tweak if needed

            // 2. Sort rows from top to bottom
            const sortedY = Object.keys(rows)
                .map(Number)
                .sort((a, b) => b - a);
            
            let currentItem = null;

            let rowList = sortedY.map(y => ({
                y,
                items: rows[y].sort((a, b) => a.x - b.x).filter(i => i.str !== "")
            }));

            for (let idx = 0; idx < rowList.length; idx++) {
                const row = rowList[idx];
                const fullRowText = row.items.map(i => i.str).join(" ");

                const codeMatch = fullRowText.match(/(\d{3}-\d{3}-\d{3}-\d{4})/);

                if (codeMatch) {
                    const code = codeMatch[1];

                    let nameParts = [];
                    let quantity = 0;

                    for (let j = idx; j < Math.min(idx + 6, rowList.length); j++) {
                        const nextRow = rowList[j];

                        const leftTexts = [];
                        const rightNums = [];

                        nextRow.items.forEach(item => {
                            const clean = item.str.replace(/[^\d]/g, '');

                            if (item.x > QTY_X_THRESHOLD && clean.length > 0) {
                                rightNums.push(parseInt(clean, 10));
                            } else {
                                leftTexts.push(item.str);
                            }
                        });

                        let rowText = leftTexts.join(" ").trim();
                        // 🔥 Remove full code
                        rowText = rowText.replace(code, '').trim();

                        // 🔥 Remove partial code fragments
                        rowText = rowText.replace(/\b\d{3}-\d{3}-\d{3}-?\b/g, '').trim();

                        // 🔥 Remove trailing numbers
                        rowText = rowText.replace(/(\d+\s*)+$/, '').trim();

                        // ❌ Skip useless fragments like "S)" or "/TUDUNG)"
                        if (rowText.length <= 3) continue;

                        // ✅ Found quantity row
                        if (rightNums.length >= 1) {
                            quantity = rightNums[rightNums.length - 1];

                            if (rowText) nameParts.push(rowText);
                            break;
                        }

                        // ✅ Otherwise part of name
                        if (
                            rowText &&
                            !rowText.includes("Pemohon") &&
                            !rowText.includes("Tarikh") &&
                            !rowText.includes(code)
                        ) {
                            // 🔥 If previous line ends with "(" → merge
                            if (
                                nameParts.length > 0 &&
                                nameParts[nameParts.length - 1].endsWith("(")
                            ) {
                                nameParts[nameParts.length - 1] += " " + rowText;
                            } 
                            // 🔥 If this line starts with ")" → merge backward
                            else if (rowText.startsWith(")") && nameParts.length > 0) {
                                nameParts[nameParts.length - 1] += rowText;
                            }
                            else {
                                nameParts.push(rowText);
                            }
                        }
                    }

                    let finalName = nameParts
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .replace(/\(\s+/g, '(')
                        .replace(/\s+\)/g, ')')
                        .trim();

                    results.push({
                        code,
                        name: nameParts.join(" ").replace(/\s+/g, ' ').trim(),
                        quantity
                    });
                }
            }
        }

        // Final cleanup of names and filtering empty quantities
        const cleanResults = results
            .filter(item => item.quantity > 0)
            .map(item => ({
                ...item,
                name: item.name.replace(/\s+/g, ' ').trim()
            }));

        if (cleanResults.length === 0) {
            return res.status(400).json({ success: false, message: "No items detected." });
        }

        res.json({ success: true, transferred: cleanResults });

    } catch (err) {
        console.error("[BACKEND] PDF Grid Parse Error:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// All route
app.get("/api/history", jwtAuth, async (req, res) => {
	logger.info("Received getinventory request");

	// FIX: Added Warehouse to the allowed roles
    if (req.user.role !== "Admin" && req.user.role !== "Clinic" && req.user.role !== "Warehouse")
        return res.status(403).json({ error: "Forbidden" });

    // Handle Admin/Warehouse who might not have a specific location in their JWT
    const locationParam = req.user.location ? `&location=${req.user.location}` : "";

    const { data: historyData } = await axios.get(
        `${GOOGLE_URL}?action=getHistory${locationParam}`,
    );
    res.json(historyData);
});

// All route
app.get("/api/getinventory", jwtAuth, async (req, res) => {
	logger.info("Received getinventory request");

	// FIX: Added Admin to the allowed roles
    if (req.user.role !== "Warehouse" && req.user.role !== "Clinic" && req.user.role !== "Admin")
        return res.status(403).json({ error: "Forbidden" });

    const { data: inventoryData } = await axios.get(
        `${GOOGLE_URL}?action=getInventory`,
    );

    res.json(inventoryData);
});

// Serve html on all routes other than the ones declared
app.use("/", (req, res, next) => {
	if (req.method !== "GET") return next();
	res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(notFound);
app.use(errorHandler);

try {
	app.listen(PORT, () => {
		logger.info(`InventoryApp is running on port ${PORT}`);
	});
} catch (error) {
	logger.error("Error starting server:", error);
	process.exit(1);
}
