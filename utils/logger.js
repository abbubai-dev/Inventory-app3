import path from "node:path";
import deadslog from "deadslog";

const logger = deadslog({
	fileOutput: {
		enabled: true,
		logFilePath: path.join(process.cwd(), "logs", "app.log"),
	},
});

export default logger;
