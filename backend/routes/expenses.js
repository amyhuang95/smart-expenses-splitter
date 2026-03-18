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

    const parsedAmount = parseFloat(amount);
    const share =
      Math.round((parsedAmount / splitBetween.length) * 100) / 100;
    const splitDetails = {};
    const paidStatus = {};
    splitBetween.forEach((userId) => {
      splitDetails[userId] = share;
      paidStatus[userId] = userId === paidBy;
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

// ── STATS — Spending statistics for a user ──
router.get("/stats", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ error: "user query required" });
    }

    const expenses = await col.find({ splitBetween: user }).toArray();

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgExpense =
      expenses.length > 0 ? totalSpending / expenses.length : 0;
    const biggestExpense =
      expenses.length > 0
        ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max))
        : null;

    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] =
        (categoryBreakdown[e.category] || 0) + e.amount;
    });

    let youOwe = 0;
    let owedToYou = 0;
    expenses.forEach((e) => {
      if (e.settled) return;
      const myShare = e.splitDetails?.[user] || 0;
      if (e.paidBy === user) {
        e.splitBetween.forEach((p) => {
          if (p !== user && !e.paidStatus?.[p]) {
            owedToYou += e.splitDetails?.[p] || 0;
          }
        });
      } else {
        if (!e.paidStatus?.[user]) {
          youOwe += myShare;
        }
      }
    });

    res.json({
      totalSpending,
      avgExpense: Math.round(avgExpense * 100) / 100,
      biggestExpense,
      expenseCount: expenses.length,
      categoryBreakdown,
      youOwe: Math.round(youOwe * 100) / 100,
      owedToYou: Math.round(owedToYou * 100) / 100,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ══════════════════════════════════════════════════
// NEW IN COMMIT 5: BALANCES endpoint
// ══════════════════════════════════════════════════

// ── BALANCES — Per-person balance for current user ──
router.get("/balances", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ error: "user query required" });
    }

    const expenses = await col
      .find({ splitBetween: user, settled: false })
      .toArray();

    // Calculate per-person balances
    const personBalances = {};

    expenses.forEach((e) => {
      if (e.paidBy === user) {
        // I paid → everyone else owes me their share
        e.splitBetween.forEach((p) => {
          if (p === user) return;
          const theirShare = e.splitDetails?.[p] || 0;
          if (!e.paidStatus?.[p]) {
            personBalances[p] = (personBalances[p] || 0) + theirShare;
          }
        });
      } else {
        // Someone else paid → I owe them my share
        const myShare = e.splitDetails?.[user] || 0;
        if (!e.paidStatus?.[user]) {
          personBalances[e.paidBy] =
            (personBalances[e.paidBy] || 0) - myShare;
        }
      }
    });

    // Format into array
    const details = Object.entries(personBalances)
      .map(([person, amount]) => ({
        person,
        amount: Math.round(Math.abs(amount) * 100) / 100,
        direction: amount > 0 ? "owes_you" : "you_owe",
      }))
      .filter((d) => d.amount > 0.01);

    const youOwe = details
      .filter((d) => d.direction === "you_owe")
      .reduce((s, d) => s + d.amount, 0);
    const owedToYou = details
      .filter((d) => d.direction === "owes_you")
      .reduce((s, d) => s + d.amount, 0);

    res.json({
      summary: {
        youOwe: Math.round(youOwe * 100) / 100,
        owedToYou: Math.round(owedToYou * 100) / 100,
        net: Math.round((owedToYou - youOwe) * 100) / 100,
      },
      details,
    });
  } catch (err) {
    console.error("Error computing balances:", err);
    res.status(500).json({ error: "Failed to compute balances" });
  }
});

// ══════════════════════════════════════════════════

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
