import express from "express";
import { ObjectId } from "mongodb";
import { getExpensesCollection } from "../db/expensesCollection.js";

const router = express.Router();

// ─── CREATE — Add a new single expense ───
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

    // Auto-calculate equal split
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

// ─── READ ALL — Get expenses I'm involved in (with filters & sort) ───
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

// ─── STATS — Spending statistics for a user ───
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

    // Calculate what user owes and is owed
    let youOwe = 0;
    let owedToYou = 0;
    expenses.forEach((e) => {
      if (e.settled) return;
      const myShare = e.splitDetails?.[user] || 0;
      if (e.paidBy === user) {
        // I paid, others owe me their unpaid shares
        e.splitBetween.forEach((p) => {
          if (p !== user && !e.paidStatus?.[p]) {
            owedToYou += e.splitDetails?.[p] || 0;
          }
        });
      } else {
        // Someone else paid, I owe them if I haven't paid
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

// ─── BALANCES — Per-person balance breakdown for a user ───
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

    const personBalances = {};

    expenses.forEach((e) => {
      if (e.paidBy === user) {
        // I paid → everyone else owes me their share
        e.splitBetween.forEach((p) => {
          if (p === user) return;
          if (!e.paidStatus?.[p]) {
            const theirShare = e.splitDetails?.[p] || 0;
            personBalances[p] = (personBalances[p] || 0) + theirShare;
          }
        });
      } else {
        // Someone else paid → I owe them my share
        if (!e.paidStatus?.[user]) {
          const myShare = e.splitDetails?.[user] || 0;
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

// ─── READ ONE ───
router.get("/:id", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const expense = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  } catch (err) {
    console.error("Error fetching expense:", err);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

// ─── UPDATE — Edit expense details ───
router.put("/:id", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { name, description, amount, category, paidBy, splitBetween } =
      req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (paidBy !== undefined) updateFields.paidBy = paidBy;

    // If amount or splitBetween changed, recalculate splits
    if (amount !== undefined || splitBetween !== undefined) {
      const newAmount =
        amount !== undefined ? parseFloat(amount) : undefined;
      if (newAmount !== undefined) updateFields.amount = newAmount;

      if (splitBetween !== undefined) {
        updateFields.splitBetween = splitBetween;
      }

      // Recalculate splitDetails if we have both values
      const finalAmount = newAmount;
      const finalMembers = splitBetween;
      if (finalAmount && finalMembers && finalMembers.length > 0) {
        const share =
          Math.round((finalAmount / finalMembers.length) * 100) / 100;
        const splitDetails = {};
        finalMembers.forEach((userId) => {
          splitDetails[userId] = share;
        });
        updateFields.splitDetails = splitDetails;
      }
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: "after" },
    );
    if (!result) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(result);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// ─── MARK AS PAID — User marks their share as paid ───
router.put("/:id/paid", async (req, res) => {
  try {
    const col = getExpensesCollection();
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ error: "user is required" });
    }

    const expense = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const paidStatus = expense.paidStatus || {};
    paidStatus[user] = true;

    // Check if everyone has paid
    const allPaid = expense.splitBetween.every((p) => paidStatus[p]);

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { paidStatus, settled: allPaid } },
      { returnDocument: "after" },
    );
    res.json(result);
  } catch (err) {
    console.error("Error marking paid:", err);
    res.status(500).json({ error: "Failed to mark as paid" });
  }
});

// ─── DELETE ───
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
