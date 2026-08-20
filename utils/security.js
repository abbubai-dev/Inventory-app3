import { randomBytes } from "node:crypto";

// =========================================================================
// SEKURITI: Rate limiting, OTP lockout & unpredictable ID generator
// Extracted into its own module so it can be unit-tested without a database.
// =========================================================================

// Fixed-window in-memory rate limiter (per key). Keeps brute-force attempts bounded.
const rateBucket = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 10;                   // max attempts per window per key

export function rateLimit(key) {
    const now = Date.now();
    const entry = rateBucket.get(key);
    if (!entry || now > entry.expires) {
        rateBucket.set(key, { count: 1, expires: now + RATE_WINDOW_MS });
        return { allowed: true, remaining: RATE_MAX - 1, count: 1 };
    }
    entry.count += 1;
    const allowed = entry.count <= RATE_MAX;
    return { allowed, remaining: Math.max(0, RATE_MAX - entry.count), count: entry.count };
}

// Per-username OTP brute-force lockout: N failed tries invalidates the live OTP
// and locks the account for a cooldown window.
const registerCallbacks = { onLockout: null }; // hook for tests / observability
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_LOCKOUT_MS = 15 * 60 * 1000;

const otpAttempts = new Map(); // key -> { failed, lockedUntil }

export function registerOtpFailure(key) {
    const rec = otpAttempts.get(key) || { failed: 0, lockedUntil: 0 };
    rec.failed += 1;
    if (rec.failed >= MAX_OTP_ATTEMPTS) {
        rec.lockedUntil = Date.now() + OTP_LOCKOUT_MS;
        rec.failed = 0;
        if (registerCallbacks.onLockout) registerCallbacks.onLockout(key);
    }
    otpAttempts.set(key, rec);
    return rec;
}

export function otpLockedOut(key) {
    const rec = otpAttempts.get(key);
    if (!rec) return false;
    if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
    otpAttempts.delete(key); // cooldown expired, allow attempts again
    return false;
}

// Unpredictable transaction id — unguessable so QR/confirm keys can't be brute-forced.
export const makeTxnId = (prefix = "TXN") => `${prefix}-${randomBytes(16).toString("hex")}`;

// Normalise the client IP for rate-limiting (reverse-proxy aware).
export const clientIp = (req) =>
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "anon";

export { RATE_WINDOW_MS, RATE_MAX };