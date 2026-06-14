import postgres from 'postgres';

// 1. Check if the training sandbox is requested
const isSandbox = process.env.APP_MODE === "sandbox";

// 2. Dynamically choose the correct connection string string matching the mode
const databaseUrl = isSandbox ? process.env.DATABASE_URL_SANDBOX : process.env.DATABASE_URL_PROD;

// 3. Early defensive guard system crash check
if (!databaseUrl) {
  throw new Error(`CRITICAL: Database connection string for [${isSandbox ? "SANDBOX" : "PRODUCTION"}] is missing in your .env file!`);
}

// 4. Print validation status to your server console window
console.log("--------------------------------------------------");
console.log(` ENVIRONMENT ENGINE: ${isSandbox ? "🛠️  SANDBOX TRAINING ACTIVE" : "🚀 LIVE PRODUCTION ACTIVE"}`);
console.log("--------------------------------------------------");

// 5. Connect cleanly to the chosen target
const sql = postgres(databaseUrl);

export default sql;