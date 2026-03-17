import bcrypt from "bcrypt";
import { Router } from "express";
import {
  createUser,
  findUserByEmail,
  normalizeEmail,
  serializeUser,
} from "../db/usersCollection.js";

const router = Router();
const SALT_ROUNDS = 10;

function readBodyString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Get current authenticated user
router.get("/me", (req, res) => {
  res.json({ user: req.currentUser });
});

// Register a new user
router.post("/register", async (req, res, next) => {
  const name = readBodyString(req.body?.name);
  const email = readBodyString(req.body?.email);
  const password = readBodyString(req.body?.password);

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res
        .status(409)
        .json({ error: "An account with that email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      name,
      email: normalizeEmail(email),
      passwordHash,
    });

    // Regenerate session to prevent fixation and set userId
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user._id.toString();
      res.status(201).json({ user: serializeUser(user) });
    });
  } catch (error) {
    next(error);
  }
});

// Login an existing user
router.post("/login", async (req, res, next) => {
  const email = readBodyString(req.body?.email);
  const password = readBodyString(req.body?.password);

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Regenerate session to prevent fixation and set userId
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user._id.toString();
      res.json({ user: serializeUser(user) });
    });
  } catch (error) {
    next(error);
  }
});

// Logout the current user
router.post("/logout", (req, res, next) => {
  if (!req.session) {
    res.status(204).end();
    return;
  }

  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("spliteasy.sid");
    res.status(204).end();
  });
});

export default router;
