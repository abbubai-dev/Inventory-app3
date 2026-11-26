import { describe, expect, it } from "bun:test";
import {
    clientIp,
    makeTxnId,
    otpLockedOut,
    registerOtpFailure,
    rateLimit,
    MAX_OTP_ATTEMPTS,
} from "./security";

describe("rateLimit", () => {
    it("allows the first request", () => {
        const r = rateLimit("test:first");
        expect(r.allowed).toBe(true);
        expect(r.count).toBe(1);
    });

    it("blocks after the burst threshold", () => {
        const key = "test:burst";
        // A fresh key — hit it many times and confirm it eventually denies.
        let last;
        for (let i = 0; i < 30; i++) last = rateLimit(key);
        expect(last.allowed).toBe(false);
    });

    it("tracks distinct keys independently", () => {
        rateLimit("test:independent-a");
        const b = rateLimit("test:independent-b");
        expect(b.allowed).toBe(true);
        expect(b.count).toBe(1);
    });
});

describe("OTP lockout", () => {
    it("locks after MAX_OTP_ATTEMPTS consecutive failures", () => {
        const email = "admin@clinic.test";
        // Register MAX_OTP_ATTEMPTS failures — the 5th (threshold hit) flips the lockout on
        for (let i = 0; i < MAX_OTP_ATTEMPTS; i++) registerOtpFailure(email);
        expect(otpLockedOut(email)).toBe(true);
    });

    it("does not lock before the threshold", () => {
        const email = "nurse@clinic.test";
        for (let i = 0; i < MAX_OTP_ATTEMPTS - 1; i++) registerOtpFailure(email);
        expect(otpLockedOut(email)).toBe(false);
    });
});

describe("makeTxnId", () => {
    it("prefixes and produces a hex payload", () => {
        const id = makeTxnId();
        expect(id.startsWith("TXN-")).toBe(true);
        // hex payload (32 chars) after the "TXN-" prefix
        expect(id.split("-")[1]).toMatch(/^[0-9a-f]{32}$/);
    });

    it("supports a custom prefix", () => {
        expect(makeTxnId("RCP").startsWith("RCP-")).toBe(true);
    });

    it("is unique across many calls (unguessable vs old 6-digit keys)", () => {
        const seen = new Set();
        for (let i = 0; i < 5000; i++) seen.add(makeTxnId());
        expect(seen.size).toBe(5000);
    });
});

describe("clientIp", () => {
    it("reads the left-most forwarded address", () => {
        const req = { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, socket: {} };
        expect(clientIp(req)).toBe("1.2.3.4");
    });

    it("falls back to the socket address", () => {
        const req = { headers: {}, socket: { remoteAddress: "9.9.9.9" } };
        expect(clientIp(req)).toBe("9.9.9.9");
    });
});