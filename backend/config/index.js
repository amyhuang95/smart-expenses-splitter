import "dotenv/config";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set in environment variables.");
}

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || "spliteasy",
  sessionSecret: process.env.SESSION_SECRET,
};
