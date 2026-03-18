import { getDB } from "./connection.js";

export function getExpensesCollection() {
  return getDB().collection("expenses");
}
