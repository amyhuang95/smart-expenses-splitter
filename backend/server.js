import express from "express";
import session from "express-session";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { config } from "./config/index.js";
import { closeDB, connectDB } from "./db/connection.js";
import { hydrateSessionUser } from "./middleware/auth.js";
import { requestLogger } from "./middleware/requestLogger.js";
import expensesRouter from "./routes/expenses.js";
import groupsRouter from "./routes/groups.js";
import usersRouter from "./routes/users.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, "..", "frontend", "dist");

const app = express();

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "spliteasy.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }),
);
app.use(hydrateSessionUser);

app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/expenses", expensesRouter);

app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.use((error, req, res, _next) => {
  logger.error("Unhandled server error", error.message);
  res.status(500).json({ error: "Internal server error." });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  await closeDB();
  process.exit(0);
});

startServer();
