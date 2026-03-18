const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchExpenses(user, filters = {}) {
  const params = new URLSearchParams({ user });
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.paidBy && filters.paidBy !== "all") {
    params.set("paidBy", filters.paidBy);
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const res = await fetch(`${API_BASE}/api/expenses?${params}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function fetchExpenseStats(user) {
  const res = await fetch(`${API_BASE}/api/expenses/stats?user=${encodeURIComponent(user)}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchBalances(user) {
  const res = await fetch(`${API_BASE}/api/expenses/balances?user=${encodeURIComponent(user)}`);
  if (!res.ok) throw new Error("Failed to fetch balances");
  return res.json();
}

export async function createExpense(data) {
  const res = await fetch(`${API_BASE}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function updateExpense(id, data) {
  const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update expense");
  return res.json();
}

export async function markExpensePaid(id, user) {
  const res = await fetch(`${API_BASE}/api/expenses/${id}/paid`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });
  if (!res.ok) throw new Error("Failed to mark as paid");
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete expense");
  return res.json();
}
