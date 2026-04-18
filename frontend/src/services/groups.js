import { request } from "./api.js";

/**
 * Group service for handling group-related operations.
 */

export async function fetchGroups() {
  const data = await request("/api/groups", { method: "GET" });
  return data.groups ?? [];
}

export async function lookupUserByEmail(email) {
  return request(`/api/users/lookup?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
}

export async function createGroup(payload) {
  return request("/api/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchGroupDetails(groupId) {
  return request(`/api/groups/${groupId}`, {
    method: "GET",
  });
}

export async function updateGroup(groupId, payload) {
  return request(`/api/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(groupId) {
  return request(`/api/groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function addGroupMember(groupId, email) {
  return request(`/api/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function removeGroupMember(groupId, memberId) {
  return request(`/api/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function createGroupExpense(groupId, payload) {
  return request(`/api/groups/${groupId}/expenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGroupExpense(groupId, groupExpenseId, payload) {
  return request(`/api/groups/${groupId}/expenses/${groupExpenseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroupExpense(groupId, groupExpenseId) {
  return request(`/api/groups/${groupId}/expenses/${groupExpenseId}`, {
    method: "DELETE",
  });
}

export async function settleGroup(groupId) {
  return request(`/api/groups/${groupId}/settle`, {
    method: "POST",
  });
}

export async function markDebtAsPaid(groupId, debtId) {
  return request(`/api/groups/${groupId}/debts/${debtId}/pay`, {
    method: "PATCH",
  });
}
