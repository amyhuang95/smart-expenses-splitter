import bcrypt from "bcrypt";
import { Router } from "express";
import passport from "../config/passport.js";
import {
  createUser,
  findUserByEmail,
  normalizeEmail,
  serializeUser,
} from "../db/usersCollection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SALT_ROUNDS = 10;

function readBodyString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Get current authenticated user
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Register a new user
router.post("/register", async (req, res, next) => {
  const name = readBodyString(req.body?.name);
  const email = readBodyString(req.body?.email);
  const password = readBodyString(req.body?.password);

  // Basic validation
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  // Basic password strength check (can be enhanced with more rules)
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
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

    // Regenerate session to prevent fixation before establishing the login session.
    req.session.regenerate((err) => {
      if (err) {
        next(err);
        return;
      }

      // Pass the raw DB document so passport.serializeUser receives the
      // original user object, not one that has already been serialized.
      req.login(user, (loginError) => {
        if (loginError) {
          next(loginError);
          return;
        }

        res.status(201).json({ user: serializeUser(user) });
      });
    });
  } catch (error) {
    next(error);
  }
});

// Login an existing user
router.post("/login", (req, res, next) => {
  const email = readBodyString(req.body?.email);
  const password = readBodyString(req.body?.password);

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  // Authenticate first, then regenerate the session before writing to it.
  // Regenerating before authenticate causes req.login to write into a stale
  // session reference, which silently drops the session on the next request.
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      next(authError);
      return;
    }

    if (!user) {
      res.status(401).json({ error: info?.message ?? "Login failed." });
      return;
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        next(regenerateError);
        return;
      }

      // Pass the raw DB document so passport.serializeUser receives the
      // original user object, not one that has already been serialized.
      req.login(user, (loginError) => {
        if (loginError) {
          next(loginError);
          return;
        }

        res.json({ user: serializeUser(user) });
      });
    });
  })(req, res, next);
});

// Logout the current user
router.post("/logout", requireAuth, (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("spliteasy.sid");
    res.status(204).end();
  });
});

// Look up a single user by exact email (returns name + email, or 404).
router.get("/lookup", async (req, res, next) => {
  try {
    const email = (req.query.email ?? "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email query parameter is required." });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: "No account found for that email." });
      return;
    }

    res.json({ name: user.name, email: user.email });
  } catch (error) {
    next(error);
  }
});

// Search users by name
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      res.json([]);
      return;
    }

    const db = (await import("../db/connection.js")).getDB();
    const users = await db
      .collection("users")
      .find(
        { name: { $regex: q.trim(), $options: "i" } },
        { projection: { passwordHash: 0 } },
      )
      .limit(10)
      .toArray();

    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
