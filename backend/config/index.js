import "dotenv/config";

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || "spliteasy",
};
