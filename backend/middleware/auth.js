export function attachCurrentUser(req, _res, next) {
  req.currentUser = req.user ?? null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
