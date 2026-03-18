import { request } from "./api.js";

export async function fetchExpenses(userName, filters = {}) {
  const params = new URLSearchParams({ user: userName });
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.paidBy && filters.paidBy !== "all") {
    params.set("paidBy", filters.paidBy);
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  return request(`/api/expenses?${params}`, { method: "GET" });
}

export async function fetchExpenseStats(userName) {
  return request(`/api/expenses/stats?user=${encodeURIComponent(userName)}`, {
    method: "GET",
  });
}

export async function fetchBalances(userName) {
  return request(
    `/api/expenses/balances?user=${encodeURIComponent(userName)}`,
    { method: "GET" },
  );
}

export async function createExpense(data) {
  return request("/api/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExpense(id, data) {
  return request(`/api/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function markExpensePaid(id, userName) {
  return request(`/api/expenses/${id}/paid`, {
    method: "PUT",
    body: JSON.stringify({ user: userName }),
  });
}

export async function deleteExpense(id) {
  return request(`/api/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function searchUsers(query) {
  return request(
    `/api/users/search?q=${encodeURIComponent(query)}`,
    { method: "GET" },
  );
}