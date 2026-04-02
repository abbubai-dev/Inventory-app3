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

	const { data: loginData } = await axios.get(
		`${GOOGLE_URL}?action=getLoginData`,
	);
	const currentUser = loginData.users.find(
		(user) => user.username === username,
	);

	if (!currentUser) return res.status(404).json({ error: "Not Found" });

	await axios.get(
		`${GOOGLE_URL}?action=login&user=${currentUser.username}&pass=${password}&loc=${currentUser.selectedLoc}`,
	);

	await axios.get(
		`${GOOGLE_URL}?action=sendOTP&user=${encodeURIComponent(currentUser.username)}&email=${encodeURIComponent(currentUser.email)}`,
	);

	res.json({ success: true });
});
app.post("/api/verifyotp", async (req, res) => {
	logger.info("Received verifyOTP request:", req.body);

	const { username, password, otp } = req.body;

	if (!username || !password || !otp)
		return res.status(400).json({ error: "Bad Request" });

	const { data: loginData } = await axios.get(
		`${GOOGLE_URL}?action=getLoginData`,
	);
	const currentUser = loginData.users.find(
		(user) => user.username === username,
	);

	if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

	await axios.get(
		`${GOOGLE_URL}?action=verifyOTP&email=${currentUser.email}&otp=${otp}`,
	);

	const token = await new jose.SignJWT({
		username: currentUser.username,
		role: currentUser.role,
		location: currentUser.location,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("9h")
		.sign(new TextEncoder().encode(process.env.JWT_SECRET));

	res.json({ success: true, token });
});

// Auth routes
app.get("/api/whoami", jwtAuth, async (req, res) => {
	logger.info("Received whoami request");

	res.json(req.user);
});

// Warehouse routes
app.post("/api/checkout", jwtAuth, async (req, res) => {
	logger.info("Received checkout request", req.body);

	if (req.user.role !== "Warehouse")
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
app.post("/api/clinicactions", jwtAuth, async (req, res) => {
	logger.info(`Received ${req.body.action} request`);

	if (req.user.role !== "Clinic")
		return res.status(403).json({ error: "Forbidden" });

	await axios.post(`${GOOGLE_URL}`, req.body);

	res.json({ success: true });
});
app.post(
	"/api/processreceipt",
	jwtAuth,
	upload.single("invoice"),
	async (req, res) => {
		logger.info("Received usage request");

		if (req.user.role !== "Clinic")
			return res.status(403).json({ error: "Forbidden" });

		if (!req.file) return res.status(400).json({ error: "No file uploaded" });

		try {
			const data = await pdf(req.file.buffer);
			const text = data.text;
			const results = [];
			const lines = text.split("\n");

			lines.forEach((line) => {
				const cleanLine = line.trim();

				// KEW.PS-8 Pattern: Code/Name followed by Dimohon, Baki, Diluluskan, Diterima
				// We look for 4 numbers in a row and ignore anything after them (Catatan)
				const match = cleanLine.match(
					/(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(.*)/,
				);

				if (match) {
					results.push({
						item: match[1].trim(), // The Item Name/Code
						quantity: parseInt(match[5], 10), // The 'Kuantiti Diterima'
					});
				}
			});

			res.json({ success: true, transferred: results });
		} catch (error) {
			logger.error("PDF Processing Error:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	},
);

// Admin and clinic route
app.get("/api/history", jwtAuth, async (req, res) => {
	logger.info("Received getinventory request");

	if (req.user.role !== "Admin" && req.user.role !== "Clinic")
		return res.status(403).json({ error: "Forbidden" });

	const { data: historyData } = await axios.get(
		`${GOOGLE_URL}?action=getHistory&location=${req.user.location}`,
	);
	res.json(historyData);
});

// Warehouse and clinic route
app.get("/api/getinventory", jwtAuth, async (req, res) => {
	logger.info("Received getinventory request");

	if (req.user.role !== "Warehouse" && req.user.role !== "Clinic")
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
