import "dotenv/config";
import express from "express";
import { config } from "./config/index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { connectDB, closeDB } from "./db/connection.js";
import { logger } from "./utils/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";

import groupsRouter from "./routes/groups.js";
import usersRouter from "./routes/users.js";
import expensesRouter from "./routes/expenses.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/* Middleware */
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/expenses', expensesRouter);

// Serve React in development


// Serve React in production
app.use(express.static(join(__dirname, "..", "frontend", "dist")));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, "..", "frontend", "dist", "index.html"));
});

/* Start */
async function startServer() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info(`Server is running on localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await closeDB();
  process.exit(0);
});

startServer();
