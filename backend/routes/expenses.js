import express from "express";
import { ObjectId } from "mongodb";
import { getExpensesCollection } from "../db/expensesCollection.js";

const router = express.Router();

// ── CREATE — Add a single expense ──
router.post("/", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { name, description, amount, category, paidBy, splitBetween } =
      req.body;

    if (
      !name ||
      !amount ||
      !paidBy ||
      !splitBetween ||
      splitBetween.length === 0
    ) {
      return res.status(400).json({
        error: "name, amount, paidBy, and splitBetween are required",
      });
    }

    // Auto-calculate equal split
    const parsedAmount = parseFloat(amount);
    const share =
      Math.round((parsedAmount / splitBetween.length) * 100) / 100;
    const splitDetails = {};
    const paidStatus = {};
    splitBetween.forEach((userId) => {
      splitDetails[userId] = share;
      paidStatus[userId] = userId === paidBy; // payer is auto-paid
    });

    const newExpense = {
      name,
      description: description || "",
      amount: parsedAmount,
      category: category || "other",
      paidBy,
      splitBetween,
      splitDetails,
      paidStatus,
      settled: false,
      createdBy: paidBy,
      dateCreated: new Date(),
    };

    const result = await col.insertOne(newExpense);
    res.status(201).json({ ...newExpense, _id: result.insertedId });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// ── READ ALL — Get expenses with filters & sorting ──
router.get("/", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { user, category, paidBy, sortBy, sortOrder } = req.query;

    let filter = {};
    if (user) filter.splitBetween = user;
    if (category && category !== "all") filter.category = category;
    if (paidBy && paidBy !== "all") filter.paidBy = paidBy;

    let sort = { dateCreated: -1 };
    if (sortBy === "amount") {
      sort = { amount: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "date") {
      sort = { dateCreated: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "category") {
      sort = { category: 1 };
    }

    const expenses = await col.find(filter).sort(sort).toArray();
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// ── READ ONE ──
router.get("/:id", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const expense = await col.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  } catch (err) {
    console.error("Error fetching expense:", err);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

// ── DELETE ──
router.delete("/:id", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const result = await col.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
