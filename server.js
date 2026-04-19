import path from "node:path";
import compression from "compression";
import express from "express";
import axios from "axios";
import * as jose from "jose";
import multer, { memoryStorage } from "multer";
import pdf from "pdf-parse";

import jwtAuth from "./middleware/jwtAuth";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3000;
const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL;

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

// --- FIX: Update the PDF Regex (The "Block-Based" Parser) ---
app.post("/api/processreceipt", jwtAuth, upload.single("invoice"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        // 1. EXTRACT: Get raw text from PDF
        const data = await pdf(req.file.buffer);
        const rawText = data.text;

        // 2. FIND ALL CODES: Create a list of where every item starts
        const codeRegex = /\d{3}-\d{3}-\d{3}-\d{4}/g;
        const itemAnchors = [];
        let match;
        while ((match = codeRegex.exec(rawText)) !== null) {
            itemAnchors.push({ code: match[0], index: match.index });
        }

        // 3. PROCESS BLOCKS: Extract data between anchors
        const results = itemAnchors.map((anchor, i) => {
            const start = anchor.index;
            // The block ends where the next item starts, or at the end of the text
            const end = itemAnchors[i + 1] ? itemAnchors[i + 1].index : rawText.length;
            const block = rawText.substring(start, end);

            // 4. EXTRACT NUMBERS: Find every standalone number in this block
            const allNumbers = block.match(/\d+/g) || [];
            
            // POKA-YOKE: Filter out numbers that are part of the Item Code itself
            const codeParts = anchor.code.split('-');
            const dataNumbers = allNumbers.filter(n => !codeParts.includes(n));

            // 5. QUANTITY LOGIC: In KEW.PS-8, "Kuantiti Diterima" is the LAST number in the sequence
            // This works even if the description contains numbers like "10BX" or "1 pkt"
            const quantity = dataNumbers.length > 0 
                ? parseInt(dataNumbers[dataNumbers.length - 1], 10) 
                : 0;

            // 6. NAME LOGIC: Extract the description
            // We take the block and split it at the first comma/quote that starts the quantity columns
            let name = block.replace(anchor.code, '').trim();
            const nameMatch = name.match(/^[\s\S]+?(?="|,|\n\s*\d+)/);
            name = nameMatch ? nameMatch[0] : name.split(/\n/)[0];
            
            name = name
                .replace(/[,"'\n\r]/g, ' ') // Clean PDF artifacts
                .replace(/\s+/g, ' ')      // Clean extra spaces
                .trim();

            return { code: anchor.code, name, quantity };
        }).filter(item => item.quantity > 0);

        // 7. SUCCESS CHECK
        if (results.length === 0) {
            console.warn("⚠️ No items extracted. Raw text starts with:", rawText.substring(0, 200));
            return res.status(400).json({ success: false, message: "No items detected in PDF." });
        }

        res.json({ success: true, transferred: results });

    } catch (err) {
        console.error("❌ PDF Processing Crash:", err);
        res.status(500).json({ success: false, error: "Server error during PDF processing" });
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
