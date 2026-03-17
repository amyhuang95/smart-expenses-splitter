import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";
import { normalizeCurrencyAmount } from "../utils/currency.js";

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

  const result = await getGroupExpensesCollection().insertOne(expense);
  return {
    ...expense,
    _id: result.insertedId,
  };
}

export async function listExpensesByGroupId(groupId) {
  return getGroupExpensesCollection()
    .find({ groupId })
    .sort({ dateCreated: -1 })
    .toArray();
}

export async function findExpenseById(expenseId) {
  if (!ObjectId.isValid(expenseId)) {
    return null;
  }

  return getGroupExpensesCollection().findOne({
    _id: ObjectId.createFromHexString(expenseId),
  });
}

export async function updateGroupExpense(
  expenseId,
  { name, description, amount, category, splitBetween },
) {
  if (!ObjectId.isValid(expenseId)) {
    return null;
  }

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

  return findExpenseById(expenseId);
}
