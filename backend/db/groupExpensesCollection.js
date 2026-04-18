import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";
import { normalizeCurrencyAmount } from "../utils/currency.js";
import { logger } from "../utils/logger.js";

const GROUP_EXPENSES_COLLECTION = "groupExpenses";

export function getGroupExpensesCollection() {
  return getDB().collection(GROUP_EXPENSES_COLLECTION);
}

export function serializeGroupExpense(expense) {
  if (!expense) {
    return null;
  }

  return {
    _id: expense._id.toString(),
    groupId: expense.groupId,
    name: expense.name,
    description: expense.description ?? "",
    amount: normalizeCurrencyAmount(expense.amount),
    category: expense.category,
    paidBy: expense.paidBy,
    splitBetween: expense.splitBetween ?? [],
    splitDetails: expense.splitDetails ?? {},
    dateCreated: expense.dateCreated,
  };
}

export async function createGroupExpense({
  groupId,
  name,
  description,
  amount,
  category,
  paidBy,
  splitBetween,
}) {
  const expense = {
    groupId,
    name: name.trim(),
    description: description.trim(),
    amount: normalizeCurrencyAmount(amount),
    category,
    paidBy,
    splitBetween: [...new Set(splitBetween)],
    dateCreated: new Date(),
  };

  logger.debug("[groupExpenses] insertOne", {
    groupId,
    name: expense.name,
    amount: expense.amount,
    paidBy,
    splitCount: expense.splitBetween.length,
  });
  const result = await getGroupExpensesCollection().insertOne(expense);
  logger.debug("[groupExpenses] insertOne OK", {
    expenseId: result.insertedId.toString(),
  });

  return {
    ...expense,
    _id: result.insertedId,
  };
}

export async function listExpensesByGroupId(groupId) {
  logger.debug("[groupExpenses] find by groupId", { groupId });
  const expenses = await getGroupExpensesCollection()
    .find({ groupId })
    .sort({ dateCreated: -1 })
    .toArray();
  logger.debug("[groupExpenses] find by groupId OK", {
    groupId,
    count: expenses.length,
  });
  return expenses;
}

export async function findExpenseById(expenseId) {
  if (!ObjectId.isValid(expenseId)) {
    logger.warn("[groupExpenses] findExpenseById — invalid expenseId", {
      expenseId,
    });
    return null;
  }

  logger.debug("[groupExpenses] findOne", { expenseId });
  const expense = await getGroupExpensesCollection().findOne({
    _id: ObjectId.createFromHexString(expenseId),
  });
  logger.debug("[groupExpenses] findOne OK", {
    expenseId,
    found: expense !== null,
  });
  return expense;
}

export async function deleteGroupExpensesByGroupId(groupId) {
  logger.debug("[groupExpenses] deleteMany by groupId", { groupId });
  await getGroupExpensesCollection().deleteMany({ groupId });
  logger.debug("[groupExpenses] deleteMany by groupId OK", { groupId });
}

export async function deleteGroupExpenseById(expenseId) {
  if (!ObjectId.isValid(expenseId)) {
    logger.warn("[groupExpenses] deleteGroupExpenseById — invalid expenseId", {
      expenseId,
    });
    return false;
  }

  logger.debug("[groupExpenses] deleteOne", { expenseId });
  const result = await getGroupExpensesCollection().deleteOne({
    _id: ObjectId.createFromHexString(expenseId),
  });
  logger.debug("[groupExpenses] deleteOne OK", {
    expenseId,
    deletedCount: result.deletedCount,
  });

  return result.deletedCount === 1;
}

export async function updateGroupExpense(
  expenseId,
  { name, description, amount, category, splitBetween },
) {
  if (!ObjectId.isValid(expenseId)) {
    logger.warn("[groupExpenses] updateGroupExpense — invalid expenseId", {
      expenseId,
    });
    return null;
  }

  logger.debug("[groupExpenses] updateOne", {
    expenseId,
    name,
    amount,
    category,
    splitCount: splitBetween.length,
  });
  await getGroupExpensesCollection().updateOne(
    { _id: ObjectId.createFromHexString(expenseId) },
    {
      $set: {
        name: name.trim(),
        description: description.trim(),
        amount: normalizeCurrencyAmount(amount),
        category,
        splitBetween: [...new Set(splitBetween)],
      },
    },
  );
  logger.debug("[groupExpenses] updateOne OK", { expenseId });

  return findExpenseById(expenseId);
}
