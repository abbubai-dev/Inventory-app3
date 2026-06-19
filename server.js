import path from "node:path";
import compression from "compression";
import express from "express";
import * as jose from "jose";
import multer, { memoryStorage } from "multer";
import nodemailer from "nodemailer";
import helmet from "helmet"; // 🎯 INJECT THIS: Import the security engine

// 1. IMPORT SAMBUNGAN DATABASE KITA
import sql from "./db";

import jwtAuth from "./middleware/jwtAuth";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3000;
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const app = express();
const upload = multer({ storage: memoryStorage() });

// 1. Helmet Security Headers (Kept exactly as is to keep React working)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], 
            styleSrc: ["'self'", "'unsafe-inline'"],  
            imgSrc: ["'self'", "data:", "blob:"],     
            connectSrc: ["'self'"]                    
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// 2. 🎯 INJECT THIS: Strict Permissions Policy
app.use((req, res, next) => {
    res.setHeader(
        "Permissions-Policy", 
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    );
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Memori cache dalaman untuk menggantikan CacheService Google Apps Script bagi OTP
const otpCache = new Map();

// Clean up expired OTPs every minute automatically
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpCache.entries()) {
        if (now > data.expires) otpCache.delete(email);
    }
}, 60000);

// Konfigurasi Mesin Penghantar Emel Automatik (Nodemailer Transporter)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Poka-Yoke verification verification on server boot
transporter.verify((error) => {
    if (error) {
        logger.error("❌ Mail Engine Connection Failure Check Credentials:", error.message);
    } else {
        logger.info("🚀 Mail Engine Connected System Ready to route OTP & Alert requests.");
    }
});

// =========================================================================
// ROUTE UTAMA & AUTHENTICATION (POSTGRES MIGRATED)
// =========================================================================

// 🎯 INJECT THIS BLOCK: Broadcasts the Sandbox safety flag to the frontend UI
app.get("/api/config", (_req, res) => {
    res.json({
        isSandbox: process.env.APP_MODE === "sandbox"
    });
});

app.get("/api/getusers", async (_req, res) => {
    logger.info("Received getusers request");
    try {
        // 1. Get users matching the frontend structure
        const users = await sql`
            SELECT u.username, l.location_name as location 
            FROM users u
            LEFT JOIN locations l ON u.location_id = l.id
        `;
        
        // 2. Fetch raw locations from Postgres
        const dbLocations = await sql`SELECT location_name FROM locations`;

        // 3. Poka-Yoke: Flatten the objects into a clean array of strings
        const locations = dbLocations.map(l => l.location_name);

        // 4. Send it over in the exact shape the frontend expects
        res.json({ users, locations });
    } catch (err) {
        logger.error("Error in getusers:", err.message);
        res.status(500).json({ error: "Database Error" });
    }
});

app.post("/api/login", async (req, res) => {
    logger.info("Received login request:", req.body);
    const { username, password, selectedLoc } = req.body;

    if (!username || !password || !selectedLoc)
        return res.status(400).json({ error: "Bad Request" });

    try {
        // 1. Use LOWER() to make the username lookup case-insensitive
        const [user] = await sql`
            SELECT u.*, l.location_name 
            FROM users u
            LEFT JOIN locations l ON u.location_id = l.id
            WHERE LOWER(u.username) = LOWER(${username})
        `;

        if (!user) return res.status(404).json({ error: "User Not Found" });

        // 2. Enforce Location Safety: Selected dropdown must match their database profile
        if (user.location_name !== selectedLoc) {
            logger.warn(`User ${username} tried to log into unauthorized location: ${selectedLoc}`);
            return res.status(401).json({ error: "Unauthorized Location Access" });
        }

        // 3. Match the password hash using Bun's native verifier
        const isMatch = await Bun.password.verify(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: "Unauthorized Password" });

        const isClinic = user.role === "Clinic";
        const otpEnabled = process.env.ENABLE_OTP === 'true';

        if (isClinic && otpEnabled) { // Add TRIGGER to enable/disable OTP when needed
            // Janakan 6 digit OTP ringkas
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Simpan dalam cache memori lokal selama 5 minit
            otpCache.set(user.email, { otp, expires: Date.now() + 300000 });
            
            // HANTAR EMEL OTP SEBENAR KEPADA PENGGUNA KLINIK
            // HANTAR EMEL OTP SEBENAR KEPADA PENGGUNA KLINIK
            const mailOptions = {
                from: `"Sistem KDIP" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `🔒 KDIP Secure Access Token: ${otp}`,
                text: `Salam Sejahtera,\n\nYour security authentication token for accessing the KDIP SYSTEM is: ${otp}\n\nThis token is strictly confidential and valid for the next 5 minutes only. If you did not request this login session, please contact your systems supervisor immediately.`,
                html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #0f172a; padding: 25px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 2px;">KUALA KANGSAR DENTAL INVENTORY PLATFORM</h2>
                        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Secure Authentication Gateway</p>
                    </div>
                    
                    <div style="padding: 30px; background-color: #ffffff; color: #334155;">
                        <p style="font-size: 16px; margin-top: 0;">Salam Sejahtera,</p>
                        <p style="font-size: 15px; line-height: 1.6;">You have requested to log into the <strong>KDIP SYSTEM</strong>. Please use the secure authentication token below to complete your login sequence:</p>
                        
                        <div style="margin: 35px 0; padding: 25px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center;">
                            <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #2563eb; font-family: monospace;">${otp}</span>
                        </div>
                        
                        <p style="font-size: 14px; color: #ef4444; font-weight: bold;">⏳ This token is strictly confidential and expires in 5 minutes.</p>
                        
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                            <p style="margin: 0 0 10px 0;"><strong>SECURITY NOTICE:</strong> KDIP Administrators will <strong>never</strong> ask for your OTP. If you did not initiate this login request, please ignore this email and notify your district system supervisor immediately.</p>
                            <p style="margin: 0; font-style: italic;">This is an automated message dispatched by the KDIP Node Engine. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
                `
            };

            // Trigger the asynchronous mail blast
            transporter.sendMail(mailOptions)
                .then(() => logger.info(`[MAIL DELIVERY] OTP token successfully pushed to ${user.email}`))
                .catch(err => logger.error(`[MAIL ERROR] Failed pushing login token to ${user.email}:`, err.message));
        }

        // 4. Determine if we skip the OTP screen
        const otpSkipped = !isClinic || !otpEnabled;

        if (otpSkipped) {
            // 🎯 POKA-YOKE: Issue the token immediately since they aren't going to verifyotp
            const userPayload = {
                id: user.id,
                username: user.username,
                role: user.role,
                location: user.location_name, 
            };

            const token = await new jose.SignJWT(userPayload)
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("9h")
                .sign(new TextEncoder().encode(process.env.JWT_SECRET));

            // Return the token exactly how /api/verifyotp does
            return res.json({ 
                success: true, 
                otpSkipped: true, 
                token: token, 
                user: userPayload 
            });
        }

        // 5. If OTP is required, tell the frontend to wait for it (No token issued yet)
        return res.json({ success: true, otpSkipped: false });
    } catch (err) {
        logger.error("Error in login:", err.message);
        res.status(500).json({ error: "Database Error" });
    }
});

app.post("/api/verifyotp", async (req, res) => {
    const { username, otp } = req.body;

    try {
        // 🎯 POKA-YOKE: Explicitly select u.id to guarantee it maps to your JavaScript object
        const [user] = await sql`
            SELECT u.id, u.username, u.email, u.role, l.location_name as location 
            FROM users u
            LEFT JOIN locations l ON u.location_id = l.id
            WHERE LOWER(u.username) = LOWER(${username})
        `;
        
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (user.role === "Clinic") {
            const cachedData = otpCache.get(user.email);
            const now = Date.now();

            if (!cachedData || cachedData.otp !== otp || now > cachedData.expires) {
                return res.status(401).json({ error: "Invalid or Expired OTP" });
            }
            otpCache.delete(user.email);
        }

        // Now user.id is 100% guaranteed to exist!
        const userPayload = {
            id: user.id, 
            username: user.username,
            role: user.role,
            location: user.location,
        };

        const token = await new jose.SignJWT(userPayload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("9h")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));

        res.json({ success: true, token, user: userPayload });
    } catch (err) {
        logger.error("Error in verifyotp:", err.message);
        res.status(500).json({ error: "Database Error" });
    }
});

app.get("/api/whoami", jwtAuth, async (req, res) => {
    logger.info("Received whoami request");
    // 🎯 INJECT THE FLAG HERE TOO:
    res.json({
        ...req.user,
        isSandbox: process.env.APP_MODE === "sandbox"
    });
});

// =========================================================================
// WAREHOUSE & CLINIC ACTIONS (MANUAL ENTRY / CHECKOUT STOK)
// =========================================================================

app.post("/api/checkout", jwtAuth, async (req, res) => {
    logger.info("Received checkout request", req.body);

    if (req.user.role !== "Warehouse" && req.user.role !== "Clinic")
        return res.status(403).json({ error: "Forbidden" });

    const { cart, location } = req.body; 

    try {
        await sql.begin(async (sql) => {
            for (const item of cart) {
                const [itemData] = await sql`SELECT id FROM items WHERE item_code = ${item.code}`;
                const [locData] = await sql`SELECT id FROM locations WHERE location_name = ${location}`;
                
                if (!itemData || !locData) continue;

                // Tolak stok sedia ada
                await sql`
                    UPDATE stock 
                    SET quantity = quantity - ${Number(item.qty)}
                    WHERE item_id = ${itemData.id} AND location_id = ${locData.id}
                `;

                // ✅ FIXED: Generates an absolute unique tracking token row ID key signature per iteration item
                const checkoutTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

                // Cipta sejarah transaksi audit log
                await sql`
                    INSERT INTO transactions (id, item_id, location_id, user_id, quantity, operation, status_override)
                    VALUES (${checkoutTxnId}, ${itemData.id}, ${locData.id}, ${req.user.id}, ${Number(item.qty)}, 'deduct', 'Checkout')
                `;
            }
        });
        res.json({ status: "success" });
    } catch (err) {
        logger.error("Checkout failed:", err.message);
        res.status(500).json({ error: "Transaction Failed" });
    }
});

// =========================================================================
// ADMIN MODUL OPERATIONS
// =========================================================================

app.get("/api/getfullusers", jwtAuth, async (req, res) => {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
    
    // ✅ FIXED: Removed secondary_email field parameter query since the column was dropped
    const users = await sql`
        SELECT u.id, u.username, u.email, u.role, l.location_name as location 
        FROM users u
        LEFT JOIN locations l ON u.location_id = l.id
    `;
    res.json(users);
});

app.post("/api/adduser", jwtAuth, async (req, res) => {
    logger.info("Received adduser form submission request");

    if (req.user.role !== "Admin") 
        return res.status(403).json({ error: "Forbidden" });

    const { username, email, location, password, role } = req.body;

    try {
        const [locData] = await sql`
            SELECT id FROM locations WHERE location_name = ${location}
        `;
        
        if (!locData) {
            return res.status(400).json({ error: "Selected clinic location does not exist." });
        }

        const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
        
        await sql`
            INSERT INTO users (username, email, location_id, password_hash, role)
            VALUES (${username}, ${email}, ${locData.id}, ${hash}, ${role})
        `;
        
        res.json({ success: true });
    } catch (err) {
        logger.error("Failed to execute adduser routine:", err.message);
        res.status(500).json({ error: "Failed to create new system user profile" });
    }
});

app.get("/api/masteritems", jwtAuth, async (req, res) => {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
    try {
        const items = await sql`
            SELECT item_code as "Item_Code", item_name as "Item_Name", 
                   alias as "Alias", unit_multiplier as "Unit" 
            FROM items
            ORDER BY item_code ASC
        `;
        res.json(items);
    } catch (err) {
        logger.error("Failed to fetch master item repository:", err.message);
        res.status(500).json({ error: "Database Error" });
    }
});

app.get("/api/analytics", jwtAuth, async (req, res) => {
    // Only Admin (and maybe Warehouse) should see full district analytics
    if (req.user.role !== "Admin" && req.user.role !== "Warehouse") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        // 1. Top Consuming Clinics (Usage Volume)
        const topClinics = await sql`
            SELECT l.location_name as name, SUM(t.quantity)::int as total_used
            FROM transactions t
            JOIN locations l ON t.location_id = l.id
            WHERE t.operation = 'deduct' AND t.status_override = 'Used'
            GROUP BY l.location_name
            ORDER BY total_used DESC LIMIT 5
        `;

        // 2. Fastest Moving Items (High Burn Rate)
        const topItems = await sql`
            SELECT i.item_name as name, SUM(t.quantity)::int as total_used
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            WHERE t.operation = 'deduct' AND t.status_override = 'Used'
            GROUP BY i.item_name
            ORDER BY total_used DESC LIMIT 5
        `;

        // 3. Inter-Clinic Dependency (Borrowing/Transfers)
        const topTransfers = await sql`
            SELECT fl.location_name as from_loc, tl.location_name as to_loc, COUNT(t.id)::int as transfer_count
            FROM transactions t
            JOIN locations fl ON t.from_location_id = fl.id
            JOIN locations tl ON t.location_id = tl.id
            WHERE t.operation = 'transfer'
            GROUP BY fl.location_name, tl.location_name
            ORDER BY transfer_count DESC LIMIT 5
        `;

        // 4. Most Active System Users (Audit Compliance)
        const activeUsers = await sql`
            SELECT u.username as name, COUNT(t.id)::int as activities
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            GROUP BY u.username
            ORDER BY activities DESC LIMIT 5
        `;

        res.json({
            topClinics: topClinics || [],
            topItems: topItems || [],
            topTransfers: topTransfers || [],
            activeUsers: activeUsers || []
        });

    } catch (err) {
        logger.error("Failed to fetch analytics:", err.message);
        res.status(500).json({ error: "Analytics processing failed" });
    }
});

// =========================================================================
// CLINIC BACKEND ACTIONS (RECORD USAGE, TRANSEFER, CONFIRM RECEIPT)
// =========================================================================

app.post("/api/clinicaction", jwtAuth, async (req, res) => {
    const { action, cart, location, txnId, items } = req.body;
    logger.info(`[GATEWAY ACTION] Processing request type: ${action}`);

    try {
        if (!req.user || !req.user.username) {
            logger.error("[Clinic Action Error] Access denied. No verified username attached to session.");
            return res.status(401).json({ error: "Session invalid. Please log out and log back in." });
        }

        const [dbUser] = await sql`
            SELECT id FROM users WHERE LOWER(username) = LOWER(${req.user.username})
        `;

        if (!dbUser || !dbUser.id) {
            logger.error(`[Clinic Action Error] Could not resolve database ID for user: ${req.user.username}`);
            return res.status(401).json({ error: "User profile integrity check failed." });
        }

        const resolvedUserId = dbUser.id; 

        // ==========================================
        // ACTION A: Record Usage (Clinic Consumption)
        // ==========================================
        if (action === "recordUsage") {
            const targetLocName = location || req.user.location;
            if (!targetLocName) return res.status(400).json({ error: "Missing clinic location identifier." });

            await sql.begin(async (sql) => {
                for (const item of cart) {
                    if (!item.code) continue;

                    const [itemData] = await sql`SELECT id FROM items WHERE item_code = ${item.code}`;
                    const [locData] = await sql`SELECT id FROM locations WHERE location_name = ${targetLocName}`;
                    
                    if (!itemData || !locData) {
                        logger.warn(`[recordUsage Warning] Skipped Item Code: ${item.code} at Loc: ${targetLocName}. Missing in master tables.`);
                        continue;
                    }

                    // Deduct from current clinic balance (Forcing a positive number to ensure subtraction)
                    const safeQty = Math.abs(Number(item.qty));
                    await sql`
                        UPDATE stock SET quantity = quantity - ${safeQty}
                        WHERE item_id = ${itemData.id} AND location_id = ${locData.id}
                    `;

                    // ✅ FIXED: Generates unique custom transaction ID string block per row entry item
                    const usageTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

                    await sql`
                        INSERT INTO transactions (id, item_id, location_id, from_location_id, user_id, quantity, operation, status_override)
                        VALUES (${usageTxnId}, ${itemData.id}, ${locData.id}, ${locData.id}, ${resolvedUserId}, ${safeQty}, 'deduct', 'Used')
                    `;
                }
            });
            return res.json({ status: "success" });
        }

        // ==========================================
        // ACTION B: Checkout (Initiate QR Transfer)
        // ==========================================
        if (action === "checkout") {
            const baseTxnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
            await sql.begin(async (sql) => {
                for (const item of cart) {
                    if (!item.code) continue;

                    const [itemData] = await sql`SELECT id FROM items WHERE item_code = ${item.code}`;
                    const [fromLoc] = await sql`SELECT id FROM locations WHERE location_name = ${req.body.from}`;
                    const [toLoc] = await sql`SELECT id FROM locations WHERE location_name = ${req.body.to}`;

                    if (!itemData || !fromLoc || !toLoc) continue;

                    // Deduct balance from sender immediately
                    await sql`
                        UPDATE stock SET quantity = quantity - ${Number(item.qty)}
                        WHERE item_id = ${itemData.id} AND location_id = ${fromLoc.id}
                    `;

                    // ✅ FIXED: Creates composite primary key suffix identifier string to allow multiple items per scanning payload batch
                    const compositeTxnId = `${baseTxnId}_${itemData.id}`;

                    await sql`
                        INSERT INTO transactions (id, item_id, location_id, from_location_id, user_id, quantity, operation, status_override)
                        VALUES (${compositeTxnId}, ${itemData.id}, ${toLoc.id}, ${fromLoc.id}, ${resolvedUserId}, ${Number(item.qty)}, 'transfer', 'Pending')
                    `;
                }
            });
            return res.json({ status: "success", txnId: baseTxnId });
        }

        // ==========================================
        // ACTION C: Confirm Receipt (Scan QR Scanner)
        // ==========================================
        if (action === "confirmReceipt") {
            await sql.begin(async (sql) => {
                // ✅ FIXED: Query looks up exact match OR any row starting with batch prefix string sequence
                const pendingItems = await sql`
                    SELECT * FROM transactions 
                    WHERE (id = ${txnId} OR id LIKE ${txnId + '_%'}) AND status_override = 'Pending'
                `;
                
                for (const item of pendingItems) {
                    await sql`
                        INSERT INTO stock (item_id, location_id, quantity)
                        VALUES (${item.item_id}, ${item.location_id}, ${item.quantity})
                        ON CONFLICT (item_id, location_id)
                        DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity
                    `;
                }

                // Complete the transfer lifecycle, tagging the operation with the user who scanned it
                await sql`
                    UPDATE transactions 
                    SET status_override = 'TransferIn', user_id = ${resolvedUserId}, timestamp = NOW() 
                    WHERE id = ${txnId} OR id LIKE ${txnId + '_%'}
                `;
            });
            return res.json({ status: "success" });
        }

        // ==========================================
        // ACTION D: Low Stock Email Request (Andon)
        // ==========================================
        if (action === "refillRequest") {
            if (!items || items.length === 0) return res.status(400).json({ error: "No items passed" });

            const formattedItemList = items.map(i => `• ${i.name} — (Current Balance: ${i.stock})`).join("\n");
            const alertMailOptions = {
                from: `"KDIP Automation" <${process.env.EMAIL_USER}>`,
                to: process.env.STOR_MANAGER_EMAIL,
                subject: `⚠️ REPLENISHMENT DEMAND: [${location}]`,
                text: `Salam Store Manager,\n\nStock levels at Clinic ${location} have dropped below safety thresholds:\n\n${formattedItemList}`,
            };

            await transporter.sendMail(alertMailOptions);
            return res.json({ status: "success" });
        }

        // ==========================================
        // ACTION E: Process Digital Receipt (KEW.PS-8)
        // ==========================================
        if (action === "processReceipt") {
            await sql.begin(async (sql) => {
                for (const item of cart) {
                    if (!item.code) continue;

                    const [itemData] = await sql`SELECT id, unit_multiplier FROM items WHERE item_code = ${item.code}`;
                    const [locData] = await sql`SELECT id FROM locations WHERE location_name = ${location}`;
                    
                    if (!itemData || !locData) continue;

                    const totalToIncrement = Number(item.qty) * (itemData.unit_multiplier || 1);

                    await sql`
                        INSERT INTO stock (item_id, location_id, quantity)
                        VALUES (${itemData.id}, ${locData.id}, ${totalToIncrement})
                        ON CONFLICT (item_id, location_id)
                        DO UPDATE SET quantity = stock.quantity + ${totalToIncrement}
                    `;

                    // ✅ FIXED: Generates an absolute unique row identifier string log entry key signature
                    const addTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

                    await sql`
                        INSERT INTO transactions (id, item_id, location_id, user_id, quantity, operation, status_override)
                        VALUES (${addTxnId}, ${itemData.id}, ${locData.id}, ${resolvedUserId}, ${totalToIncrement}, 'add', 'Add')
                    `;
                }
            });
            return res.json({ status: "success" });
        }

        res.status(400).json({ error: "Unknown action parameter profile value" });
    } catch (err) {
        logger.error(`[CRITICAL FAILURE] Interface operation run error [${action}]:`, err.message);
        res.status(500).json({ error: "Internal processing crash sequence triggered." });
    }
});

// =========================================================================
// HIGH PRECISION GEOMETRY-AWARE PDF PARSER (KEKAL 100% ASAL)
// =========================================================================
app.post("/api/processreceipt", jwtAuth, upload.single("invoice"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        const data = new Uint8Array(req.file.buffer);
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
            
            const rows = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                const rowKey = Object.keys(rows).find(key => Math.abs(key - y) <= 5) || y;
                if (!rows[rowKey]) rows[rowKey] = [];
                rows[rowKey].push({
                    str: item.str.trim(),
                    x: item.transform[4]
                });
            });

            const QTY_X_THRESHOLD = 450;
            const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);
            
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
                        rowText = rowText.replace(code, '').trim();
                        rowText = rowText.replace(/\b\d{3}-\d{3}-\d{3}-?\b/g, '').trim();
                        rowText = rowText.replace(/(\d+\s*)+$/, '').trim();

                        if (rowText.length <= 3) continue;

                        if (rightNums.length >= 1) {
                            quantity = rightNums[rightNums.length - 1];
                            if (rowText) nameParts.push(rowText);
                            break;
                        }

                        if (rowText && !rowText.includes("Pemohon") && !rowText.includes("Tarikh") && !rowText.includes(code)) {
                            if (nameParts.length > 0 && nameParts[nameParts.length - 1].endsWith("(")) {
                                nameParts[nameParts.length - 1] += " " + rowText;
                            } else if (rowText.startsWith(")") && nameParts.length > 0) {
                                nameParts[nameParts.length - 1] += rowText;
                            } else {
                                nameParts.push(rowText);
                            }
                        }
                    }

                    results.push({
                        code,
                        name: nameParts.join(" ").replace(/\s+/g, ' ').trim(),
                        quantity
                    });
                }
            }
        }

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

// =========================================================================
// INVENTORY DAN SEJARAH DATA RETRIEVAL (POSTGRES MIGRATED)
// =========================================================================

app.get("/api/history", jwtAuth, async (req, res) => {
    try {
        const logs = await sql`
            SELECT t.id as "TxnID", i.item_code as "Item_Code", i.item_name as "Item_Name", 
                   fl.location_name as "Location_From", tl.location_name as "Location_To", 
                   t.quantity as "Total_Items", t.operation, t.status_override as "Status", 
                   t.timestamp as "Timestamp", u.username as "User"
            FROM transactions t
            JOIN items i ON t.item_id = i.id
            JOIN locations tl ON t.location_id = tl.id
            LEFT JOIN locations fl ON t.from_location_id = fl.id
            JOIN users u ON t.user_id = u.id
            ORDER BY t.timestamp DESC
        `;

        const usage = logs.filter(log => log.Status === "Used");
        const transfers = logs.filter(log => ["Pending", "TransferIn", "TransferOut", "Add"].includes(log.Status));

        res.json({ transfers, usage });
    } catch (err) {
        logger.error("Error in history structural split compilation:", err.message);
        res.status(500).json({ error: "Failed to extract operational logs stack" });
    }
});

app.get("/api/getinventory", jwtAuth, async (req, res) => {
    try {
        const rawStock = await sql`
            SELECT i.item_code as "Item_Code", i.item_name as "Item_Name", 
                   i.alias as "Alias", l.location_name, s.quantity, s.min_stock as "MinStock"
            FROM stock s
            JOIN items i ON s.item_id = i.id
            JOIN locations l ON s.location_id = l.id
        `;
        
        const itemMap = {};
        for (const row of rawStock) {
            const code = row.Item_Code;
            if (!itemMap[code]) {
                itemMap[code] = {
                    Item_Code: code,
                    Item_Name: row.Item_Name,
                    Alias: row.Alias,
                    MinStock: row.MinStock
                };
            }
            itemMap[code][row.location_name] = row.quantity;
        }
        
        res.json(Object.values(itemMap));
    } catch (err) {
        logger.error("Error in getinventory pivot mapping:", err.message);
        res.status(500).json({ error: "Failed to execute inventory metrics lookup" });
    }
});

// Serve frontend build production
app.use("/", (req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use(notFound);
app.use(errorHandler);

try {
    app.listen(PORT, () => {
        logger.info(`InventoryApp running natively on Postgres & Bun layer via port ${PORT}`);
    });
} catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
}