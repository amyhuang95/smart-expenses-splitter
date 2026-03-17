import { randomUUID } from "crypto";

/**
 * Converts a currency amount into integer cents so balance calculations avoid
 * floating point drift while expenses are being split across members.
 */
function toCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

/**
 * Converts integer cents back into a two-decimal currency number for API use.
 */
function fromCents(amountInCents) {
  return Number((amountInCents / 100).toFixed(2));
}

/**
 * Builds net member balances from a group's expenses, then derives a minimal
 * debtor-to-creditor settlement plan from those balances.
 */
export function calculateGroupBalances(memberIds, expenses) {
  const balanceMap = new Map(memberIds.map((memberId) => [memberId, 0]));

  for (const expense of expenses) {
    const splitBetween = expense.splitBetween?.length
      ? expense.splitBetween
      : memberIds;

    if (!splitBetween.length) {
      continue;
    }

    const totalCents = toCents(expense.amount);
    const baseShare = Math.floor(totalCents / splitBetween.length);
    let remainder = totalCents - baseShare * splitBetween.length;

    // The payer initially covers the full expense, then each participant's
    // share is subtracted below to produce a net balance per member.
    balanceMap.set(
      expense.paidBy,
      (balanceMap.get(expense.paidBy) ?? 0) + totalCents,
    );

    for (const memberId of splitBetween) {
      // Any leftover cents from uneven division are distributed one by one so
      // the final shares always sum back to the original expense total.
      const share = remainder > 0 ? baseShare + 1 : baseShare;
      if (remainder > 0) {
        remainder -= 1;
      }

      balanceMap.set(memberId, (balanceMap.get(memberId) ?? 0) - share);
    }
  }

  const balances = [...balanceMap.entries()].map(([memberId, amount]) => ({
    memberId,
    amount: fromCents(amount),
  }));

  const creditors = balances
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({ ...entry, cents: toCents(entry.amount) }))
    .sort((left, right) => right.cents - left.cents);

  const debtors = balances
    .filter((entry) => entry.amount < 0)
    .map((entry) => ({ ...entry, cents: Math.abs(toCents(entry.amount)) }))
    .sort((left, right) => right.cents - left.cents);

  const debts = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  // Greedily match the largest debtor with the largest creditor until the
  // group is balanced. This keeps the settlement plan straightforward.
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settledCents = Math.min(creditor.cents, debtor.cents);

    // Use a UUID so debtId is always unique even if the same member pair
    // appears across multiple settlement cycles.
    debts.push({
      debtId: randomUUID(),
      senderId: debtor.memberId,
      receiverId: creditor.memberId,
      amount: fromCents(settledCents),
      isPaid: false,
      paidAt: null,
    });

    creditor.cents -= settledCents;
    debtor.cents -= settledCents;

    if (creditor.cents === 0) {
      creditorIndex += 1;
    }

    if (debtor.cents === 0) {
      debtorIndex += 1;
    }
  }

  return {
    balances,
    debts,
    totalExpenseAmount: fromCents(
      expenses.reduce((sum, expense) => sum + toCents(expense.amount), 0),
    ),
  };
}

/**
 * Sums the remaining unpaid settlement rows for groups already in settlement.
 */
export function summarizeOutstandingDebts(debts) {
  const total = debts
    .filter((debt) => !debt.isPaid)
    .reduce((sum, debt) => sum + Number(debt.amount), 0);
  return Number(total.toFixed(2));
}
