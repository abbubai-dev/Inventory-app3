import * as jose from "jose";
import logger from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (token) => {
  try {
    // 🎯 FIX: Destructure 'payload' directly from jose's response object
    const { payload } = await jose.jwtVerify(
      token, 
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload;
  } catch (error) {
    logger.error("JWT Verification Error:", error.message);
    throw new Error("Invalid token");
  }
};

const extractUserFromPayload = (payload) => {
  return {
    id: payload.id,                   // 🎯 Added: Needed for self-delete checks
    username: payload.username,
    email: payload.email,             // 🎯 Added: Needed for logging & admin updates
    role: payload.role,
    location: payload.location,       // Location name
    location_id: payload.location_id  // 🎯 Added: Needed for database SQL filtering
  };
};

export const jwtAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Clean Bearer check
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token);
    req.user = extractUserFromPayload(payload);
    next();
  } catch (error) {
    // Error is already logged inside verifyToken()
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

export default jwtAuth;