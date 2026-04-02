import * as jose from "jose";
import logger from "../utils/logger";

const jwtAuth = async (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const { payload } = await jose.jwtVerify(
			token,
			new TextEncoder().encode(process.env.JWT_SECRET),
		);
		req.user = {
			username: payload.username,
			role: payload.role,
			location: payload.location,
		};
		next();
	} catch (error) {
		logger.error("JWT Verification Error:", error);
		return res.status(401).json({ error: "Unauthorized" });
	}
};

export default jwtAuth;
