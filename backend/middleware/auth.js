import { findUserById, serializeUser } from "../db/usersCollection.js";

// Middleware to hydrate req.currentUser based on session userId
export async function hydrateSessionUser(req, res, next) {
  if (!req.session?.userId) {
    req.currentUser = null;
    next();
    return;
  }

  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      req.session.userId = null;
      req.currentUser = null;
      next();
      return;
    }

    req.currentUser = serializeUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.currentUser) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
