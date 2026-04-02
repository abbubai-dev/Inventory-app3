import logger from "../utils/logger";

const errorHandler = (err, _req, res, _next) => {
	logger.error(err);
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode);
	res.json({
		message: err.message,
		stack: process.env.NODE_ENV !== "dev" ? "🥞" : err.stack,
	});
};

export default errorHandler;
