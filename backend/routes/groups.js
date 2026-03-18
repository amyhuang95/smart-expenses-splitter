import { Router } from "express";
import {
  addMemberToGroup,
  createGroup,
  deleteGroupAndExpenses,
  deleteGroupById,
  findGroupById,
  listGroupSummariesByMember,
  markGroupDebtPaid,
  removeMemberFromGroup,
  serializeGroup,
  updateGroupSettlement,
} from "../db/groupsCollection.js";
import {
  createGroupExpense,
  findExpenseById,
  listExpensesByGroupId,
  serializeGroupExpense,
  updateGroupExpense,
} from "../db/groupExpensesCollection.js";
import {
  addGroupToUsers,
  findUserByEmail,
  findUsersByIds,
  removeGroupFromUsers,
  serializeUser,
} from "../db/usersCollection.js";
import { requireAuth } from "../middleware/auth.js";
import {
  calculateGroupBalances,
  summarizeOutstandingDebts,
} from "../utils/groupBalances.js";
import {
  hasAtMostTwoDecimals,
  normalizeCurrencyAmount,
} from "../utils/currency.js";

const router = Router();

const VALID_CATEGORIES = new Set([
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "other",
]);

const MAX_GROUP_MEMBERS = 50;

// Normalizes optional string fields from request bodies.
function readBodyString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isGroupMember(group, userId) {
  return group.memberIds?.includes(userId);
}

function isGroupOwner(group, userId) {
  return group.ownerId === userId;
}

/**
 * Builds the full group detail response consumed by the frontend.
 * The route returns denormalized user objects and computed balances so the UI
 * does not have to stitch together members, expenses, and settlement data.
 */
async function buildGroupPayload(group, currentUserId) {
  const groupId = group._id.toString();
  const expenses = await listExpensesByGroupId(groupId);
  const memberDocs = await findUsersByIds(group.memberIds ?? []);
  const members = memberDocs.map(serializeUser);
  const memberLookup = new Map(members.map((member) => [member._id, member]));
  const balanceResult = calculateGroupBalances(group.memberIds ?? [], expenses);
  const storedDebts = (group.debts ?? []).map((debt) => ({
    ...debt,
    amount: Number(debt.amount),
  }));
  const debts = group.status === "open" ? balanceResult.debts : storedDebts;
  const outstandingDebts = debts.filter((debt) => !debt.isPaid);

  return {
    group: {
      ...serializeGroup(group),
      members,
      currentUserRole: isGroupOwner(group, currentUserId) ? "owner" : "member",
    },
    expenses: expenses.map((expense) => {
      const serializedExpense = serializeGroupExpense(expense);

      return {
        ...serializedExpense,
        paidByUser: memberLookup.get(serializedExpense.paidBy) ?? null,
        splitBetweenUsers: serializedExpense.splitBetween
          .map((memberId) => memberLookup.get(memberId) ?? null)
          .filter(Boolean),
      };
    }),
    balances: balanceResult.balances.map((entry) => ({
      ...entry,
      user: memberLookup.get(entry.memberId) ?? null,
    })),
    debts: debts.map((debt) => ({
      ...debt,
      sender: memberLookup.get(debt.senderId) ?? null,
      receiver: memberLookup.get(debt.receiverId) ?? null,
    })),
    summary: {
      totalSpent: balanceResult.totalExpenseAmount,
      totalExpenses: expenses.length,
      outstandingDebtAmount:
        group.status === "open"
          ? Number(
              balanceResult.debts
                .reduce((sum, debt) => sum + debt.amount, 0)
                .toFixed(2),
            )
          : summarizeOutstandingDebts(storedDebts),
      settledDebtCount: debts.filter((debt) => debt.isPaid).length,
      outstandingDebtCount: outstandingDebts.length,
    },
  };
}

// All group endpoints require an authenticated session user.
router.use(requireAuth);

// Returns the current user's group dashboard cards.
// Uses a single aggregation query instead of calling buildGroupPayload per
// group, avoiding the 2N DB queries the previous approach incurred on load.
// Member user objects are omitted from summary cards and only fetched when
// the user opens a specific group.
router.get("/", async (req, res, next) => {
  try {
    const groupDocs = await listGroupSummariesByMember(req.currentUser._id);

    const summaries = groupDocs.map((group) => {
      const storedDebts = (group.debts ?? []).map((debt) => ({
        ...debt,
        amount: Number(debt.amount),
      }));
      const outstandingDebts = storedDebts.filter((debt) => !debt.isPaid);

      return {
        ...serializeGroup(group),
        currentUserRole: isGroupOwner(group, req.currentUser._id)
          ? "owner"
          : "member",
        summary: {
          totalSpent: Number((group._totalSpent ?? 0).toFixed(2)),
          totalExpenses: group._expenseCount ?? 0,
          // For open groups debts are only written at settle time, so
          // outstandingDebtAmount stays 0 on dashboard cards until settlement.
          outstandingDebtAmount: summarizeOutstandingDebts(storedDebts),
          settledDebtCount: storedDebts.filter((debt) => debt.isPaid).length,
          outstandingDebtCount: outstandingDebts.length,
        },
      };
    });

    res.json({ groups: summaries });
  } catch (error) {
    next(error);
  }
});

// Creates a group and resolves invited members by their registered emails.
router.post("/", async (req, res, next) => {
  const name = readBodyString(req.body?.name);
  const normalizedEmails = Array.isArray(req.body?.memberEmails)
    ? req.body.memberEmails
        .map((email) => readBodyString(email).toLowerCase())
        .filter(Boolean)
    : [];

  if (!name) {
    res.status(400).json({ error: "Group name is required." });
    return;
  }

  // Owner is added automatically, so the invite list is capped at MAX - 1.
  if (normalizedEmails.length >= MAX_GROUP_MEMBERS) {
    res.status(400).json({
      error: `A group may have at most ${MAX_GROUP_MEMBERS} members.`,
    });
    return;
  }

  try {
    const uniqueEmails = [...new Set(normalizedEmails)];
    const resolvedMembers = await Promise.all(
      uniqueEmails.map((email) => findUserByEmail(email)),
    );
    const missingEmails = uniqueEmails.filter(
      (email) => !resolvedMembers.find((member) => member?.email === email),
    );

    if (missingEmails.length) {
      const label = missingEmails.length === 1 ? "this email" : "these emails";
      res.status(404).json({
        error: `No account found for ${label}: ${missingEmails.join(", ")}. Please ask them to register for an account before adding them to a group.`,
      });
      return;
    }

    const group = await createGroup({
      name,
      ownerId: req.currentUser._id,
      memberIds: resolvedMembers
        .filter(Boolean)
        .map((member) => member._id.toString()),
    });

    // Even though all users are confirmed to exist, addGroupToUsers can still
    // fail for infrastructure reasons unrelated to user existence: a transient
    // DB connection error, a write-concern timeout, or a replica set failover
    // between the two writes. If it does, the group document already exists but
    // the users' reverse-reference arrays are stale. Attempt a compensating
    // delete so both collections stay consistent.
    try {
      await addGroupToUsers(group.memberIds, group._id.toString());
    } catch (syncError) {
      try {
        await deleteGroupById(group._id.toString());
      } catch (_) {
        // Compensating delete also failed — requires manual reconciliation.
      }
      throw syncError;
    }

    const payload = await buildGroupPayload(group, req.currentUser._id);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

// Returns one group's detail view, but only to existing members.
router.get("/:groupId", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const payload = await buildGroupPayload(group, req.currentUser._id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// Only the owner can delete a group. This removes both the group document and
// its expense ledger, then clears the reverse-reference from each member.
router.delete("/:groupId", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    if (!isGroupOwner(group, req.currentUser._id)) {
      res
        .status(403)
        .json({ error: "Only the group owner can delete groups." });
      return;
    }

    await deleteGroupAndExpenses(req.params.groupId);
    // The group is already gone at this point, so if this reverse-reference
    // cleanup fails it requires manual reconciliation rather than a rollback.
    await removeGroupFromUsers(group.memberIds ?? [], req.params.groupId);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Only the owner can invite new members after the group has been created.
router.post("/:groupId/members", async (req, res, next) => {
  const email = readBodyString(req.body?.email).toLowerCase();

  if (!email) {
    res.status(400).json({ error: "Member email is required." });
    return;
  }

  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    if (!isGroupOwner(group, req.currentUser._id)) {
      res.status(403).json({ error: "Only the group owner can add members." });
      return;
    }

    if (group.memberIds.length >= MAX_GROUP_MEMBERS) {
      res.status(400).json({
        error: `A group may have at most ${MAX_GROUP_MEMBERS} members.`,
      });
      return;
    }

    const user = await findUserByEmail(email);

    if (!user) {
      res.status(404).json({
        error: `No account found for ${email}. Please ask them to register for an account before adding them to a group.`,
      });
      return;
    }

    const memberId = user._id.toString();
    if (group.memberIds.includes(memberId)) {
      res.status(409).json({ error: "That user is already in the group." });
      return;
    }

    const updatedGroup = await addMemberToGroup(req.params.groupId, memberId);

    // Same infrastructure-failure guard as group creation: the user is known
    // to exist, but the reverse-reference update can still fail due to a
    // transient DB error between the two writes. Roll back the membership
    // change if it does so both collections stay in sync.
    try {
      await addGroupToUsers([memberId], req.params.groupId);
    } catch (syncError) {
      try {
        await removeMemberFromGroup(req.params.groupId, memberId);
      } catch (_) {
        // Compensating rollback failed — requires manual reconciliation.
      }
      throw syncError;
    }

    const payload = await buildGroupPayload(updatedGroup, req.currentUser._id);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

// Owners can remove members while the group is still open, provided the member
// is not the owner and is not already referenced by the group's expense ledger.
router.delete("/:groupId/members/:memberId", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    if (!isGroupOwner(group, req.currentUser._id)) {
      res
        .status(403)
        .json({ error: "Only the group owner can remove members." });
      return;
    }

    if (group.status !== "open") {
      res.status(409).json({
        error: "Members can only be removed while the group is open.",
      });
      return;
    }

    if (req.params.memberId === group.ownerId) {
      res.status(400).json({ error: "The group owner cannot be removed." });
      return;
    }

    if (!group.memberIds.includes(req.params.memberId)) {
      res.status(404).json({ error: "Member not found in this group." });
      return;
    }

    const expenses = await listExpensesByGroupId(req.params.groupId);
    const memberHasExpenseHistory = expenses.some(
      (expense) =>
        expense.paidBy === req.params.memberId ||
        expense.splitBetween?.includes(req.params.memberId),
    );

    if (memberHasExpenseHistory) {
      res.status(409).json({
        error:
          "This member is already part of recorded expenses and cannot be removed.",
      });
      return;
    }

    const updatedGroup = await removeMemberFromGroup(
      req.params.groupId,
      req.params.memberId,
    );

    // If the user reverse-reference update fails, restore the membership so
    // both collections stay in sync.
    try {
      await removeGroupFromUsers([req.params.memberId], req.params.groupId);
    } catch (syncError) {
      try {
        await addMemberToGroup(req.params.groupId, req.params.memberId);
      } catch (_) {
        // Compensating rollback failed — requires manual reconciliation.
      }
      throw syncError;
    }

    const payload = await buildGroupPayload(updatedGroup, req.currentUser._id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// Group expenses can be added by any member until the group enters settlement.
router.post("/:groupId/expenses", async (req, res, next) => {
  const name = readBodyString(req.body?.name);
  const description = readBodyString(req.body?.description);
  const rawCategory = readBodyString(req.body?.category) || "other";
  const amount = Number(req.body?.amount);
  const splitBetween = Array.isArray(req.body?.splitBetween)
    ? req.body.splitBetween.map((memberId) => readBodyString(memberId))
    : [];

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    res
      .status(400)
      .json({ error: "Valid expense name and amount are required." });
    return;
  }

  if (!hasAtMostTwoDecimals(amount)) {
    res.status(400).json({
      error: "Amount must use at most 2 decimal places.",
    });
    return;
  }

  if (!VALID_CATEGORIES.has(rawCategory)) {
    res.status(400).json({
      error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}.`,
    });
    return;
  }

  if (splitBetween.length > MAX_GROUP_MEMBERS) {
    res.status(400).json({
      error: `Expense split may not exceed ${MAX_GROUP_MEMBERS} members.`,
    });
    return;
  }

  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    if (group.status !== "open") {
      res.status(409).json({
        error: "Expenses are locked after the group enters settlement.",
      });
      return;
    }

    // If the client does not specify split members, default to the entire group.
    const selectedMembers = splitBetween.length
      ? splitBetween
      : group.memberIds;
    const hasInvalidMember = selectedMembers.some(
      (memberId) => !group.memberIds.includes(memberId),
    );

    if (hasInvalidMember) {
      res.status(400).json({ error: "Expense split includes a non-member." });
      return;
    }

    await createGroupExpense({
      groupId: req.params.groupId,
      name,
      description,
      amount: normalizeCurrencyAmount(amount),
      category: rawCategory,
      paidBy: req.currentUser._id,
      splitBetween: selectedMembers,
    });

    const refreshedGroup = await findGroupById(req.params.groupId);
    const payload = await buildGroupPayload(
      refreshedGroup,
      req.currentUser._id,
    );
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

// Returns one expense nested under its parent group.
router.get("/:groupId/expenses/:expenseId", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const expense = await findExpenseById(req.params.expenseId);

    if (!expense || expense.groupId.toString() !== req.params.groupId) {
      res.status(404).json({ error: "Expense not found." });
      return;
    }

    res.json({ expense: serializeGroupExpense(expense) });
  } catch (error) {
    next(error);
  }
});

// Edits remain available only while the group is open.
router.patch("/:groupId/expenses/:expenseId", async (req, res, next) => {
  const name = readBodyString(req.body?.name);
  const description = readBodyString(req.body?.description);
  const rawCategory = readBodyString(req.body?.category) || "other";
  const amount = Number(req.body?.amount);
  const splitBetween = Array.isArray(req.body?.splitBetween)
    ? req.body.splitBetween.map((memberId) => readBodyString(memberId))
    : [];

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    res
      .status(400)
      .json({ error: "Valid expense name and amount are required." });
    return;
  }

  if (!hasAtMostTwoDecimals(amount)) {
    res.status(400).json({
      error: "Amount must use at most 2 decimal places.",
    });
    return;
  }

  if (!VALID_CATEGORIES.has(rawCategory)) {
    res.status(400).json({
      error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(", ")}.`,
    });
    return;
  }

  if (splitBetween.length > MAX_GROUP_MEMBERS) {
    res.status(400).json({
      error: `Expense split may not exceed ${MAX_GROUP_MEMBERS} members.`,
    });
    return;
  }

  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const expense = await findExpenseById(req.params.expenseId);

    if (!expense || expense.groupId.toString() !== req.params.groupId) {
      res.status(404).json({ error: "Expense not found." });
      return;
    }

    if (group.status !== "open") {
      res.status(409).json({
        error: "Expenses can only be edited while the group is open.",
      });
      return;
    }

    if (
      expense.paidBy !== req.currentUser._id &&
      !isGroupOwner(group, req.currentUser._id)
    ) {
      res.status(403).json({
        error: "Only the payer or group owner can edit this expense.",
      });
      return;
    }

    const selectedMembers = splitBetween.length
      ? splitBetween
      : group.memberIds;
    const hasInvalidMember = selectedMembers.some(
      (memberId) => !group.memberIds.includes(memberId),
    );

    if (hasInvalidMember) {
      res.status(400).json({ error: "Expense split includes a non-member." });
      return;
    }

    await updateGroupExpense(req.params.expenseId, {
      name,
      description,
      amount: normalizeCurrencyAmount(amount),
      category: rawCategory,
      splitBetween: selectedMembers,
    });

    // Re-fetch the group so the returned payload reflects the latest balances
    // and summary rather than the state before this edit was applied.
    const refreshedGroup = await findGroupById(req.params.groupId);
    const payload = await buildGroupPayload(
      refreshedGroup,
      req.currentUser._id,
    );
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// Freezes the current balances into debt rows so settlement can be tracked.
router.post("/:groupId/settle", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    if (!isGroupOwner(group, req.currentUser._id)) {
      res
        .status(403)
        .json({ error: "Only the group owner can settle a group." });
      return;
    }

    if (group.status !== "open") {
      res.status(409).json({ error: "This group is already in settlement." });
      return;
    }

    // Settlement is generated from the current expense ledger at one moment
    // in time. After this, new expenses are blocked until debts are paid.
    const expenses = await listExpensesByGroupId(req.params.groupId);
    const balanceResult = calculateGroupBalances(
      group.memberIds ?? [],
      expenses,
    );
    const updatedGroup = await updateGroupSettlement(req.params.groupId, {
      debts: balanceResult.debts,
      status: balanceResult.debts.length ? "settling" : "settled",
    });
    const payload = await buildGroupPayload(updatedGroup, req.currentUser._id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// A debt can be marked paid by the sender (debtor), the receiver (creditor),
// or the group owner. Both parties to the debt are permitted so the creditor
// can acknowledge receipt without depending on the debtor to act.
router.patch("/:groupId/debts/:debtId/pay", async (req, res, next) => {
  try {
    const group = await findGroupById(req.params.groupId);

    if (!group || !isGroupMember(group, req.currentUser._id)) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const debt = (group.debts ?? []).find(
      (entry) => entry.debtId === req.params.debtId,
    );

    if (!debt) {
      res.status(404).json({ error: "Debt not found." });
      return;
    }

    const isDebtor = debt.senderId === req.currentUser._id;
    const isCreditor = debt.receiverId === req.currentUser._id;

    if (!isDebtor && !isCreditor && !isGroupOwner(group, req.currentUser._id)) {
      res.status(403).json({
        error:
          "Only the sender, receiver, or group owner can mark this debt as paid.",
      });
      return;
    }

    if (debt.isPaid) {
      res.status(409).json({ error: "This debt is already marked as paid." });
      return;
    }

    let updatedGroup = await markGroupDebtPaid(
      req.params.groupId,
      req.params.debtId,
    );

    // Once every stored debt row is paid, the group moves to the final state.
    const hasOutstandingDebt = updatedGroup.debts?.some(
      (entry) => !entry.isPaid,
    );

    if (!hasOutstandingDebt && updatedGroup.status !== "settled") {
      updatedGroup = await updateGroupSettlement(req.params.groupId, {
        debts: updatedGroup.debts,
        status: "settled",
      });
    }

    const payload = await buildGroupPayload(updatedGroup, req.currentUser._id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
