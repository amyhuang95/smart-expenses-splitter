import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(501).json({ error: "Expenses routes are not implemented yet." });
});

export default router;
