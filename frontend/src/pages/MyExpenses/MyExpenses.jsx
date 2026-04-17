import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../context/useUser.js";
import QuickStats from "../../components/QuickStats/QuickStats.jsx";
import ExpenseFilter from "../../components/ExpenseFilter/ExpenseFilter.jsx";
import ExpenseCard from "../../components/ExpenseCard/ExpenseCard.jsx";
import ExpenseForm from "../../components/ExpenseForm/ExpenseForm.jsx";
import PersonalBalanceSummary from "../../components/PersonalBalanceSummary/PersonalBalanceSummary.jsx";
import SpendingChart from "../../components/SpendingChart/SpendingChart.jsx";
import HelpTooltip from "../../components/HelpTooltip/HelpTooltip.jsx";
import {
  fetchExpenses,
  fetchExpenseStats,
  fetchBalances,
  createExpense,
  updateExpense,
  markExpensePaid,
  deleteExpense,
} from "../../services/expenses.js";
import "./MyExpenses.css";

const UNDO_TIMEOUT_MS = 5000;
const EXPENSES_PAGE_SIZE = 10;

export default function MyExpenses() {
  const { user } = useUser();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleExpenseCount, setVisibleExpenseCount] = useState(EXPENSES_PAGE_SIZE);
  const [hideSettled, setHideSettled] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    paidBy: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Reset paging when filters or hideSettled change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setVisibleExpenseCount(EXPENSES_PAGE_SIZE);
  };
  const handleHideSettledChange = (val) => {
    setHideSettled(val);
    setVisibleExpenseCount(EXPENSES_PAGE_SIZE);
  };

  // Undo toast state
  const [undoToast, setUndoToast] = useState(null);
  const undoTimeoutRef = useRef(null);

  const modalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const userName = user?.name;

  // Escape key closes modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(null);
        else if (showForm || editingExpense) {
          setShowForm(false);
          setEditingExpense(null);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm, editingExpense, confirmDelete]);

  // Auto-focus modal on open
  useEffect(() => {
    if ((showForm || editingExpense) && modalRef.current) modalRef.current.focus();
  }, [showForm, editingExpense]);

  useEffect(() => {
    if (confirmDelete && deleteModalRef.current) deleteModalRef.current.focus();
  }, [confirmDelete]);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const loadExpenses = useCallback(async () => {
    if (!userName) return;
    try {
      setLoading(true);
      const data = await fetchExpenses(userName, filters);
      setExpenses(data);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [userName, filters]);

  const loadStats = useCallback(async () => {
    if (!userName) return;
    try {
      const data = await fetchExpenseStats(userName);
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, [userName]);

  const loadBalances = useCallback(async () => {
    if (!userName) return;
    try {
      const data = await fetchBalances(userName);
      setBalances(data);
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  }, [userName]);

  const refreshAll = useCallback(() => {
    loadExpenses();
    loadStats();
    loadBalances();
  }, [loadExpenses, loadStats, loadBalances]);

  useEffect(() => {
    refreshAll();
    setVisibleExpenseCount(EXPENSES_PAGE_SIZE);
  }, [refreshAll]);

  const handleCreate = async (data) => {
    try {
      await createExpense(data);
      setShowForm(false);
      refreshAll();
    } catch (err) {
      console.error("Error creating expense:", err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateExpense(editingExpense._id, data);
      setEditingExpense(null);
      refreshAll();
    } catch (err) {
      console.error("Error updating expense:", err);
    }
  };

  const handleMarkPaid = async (expenseId) => {
    try {
      await markExpensePaid(expenseId, userName);
      refreshAll();
    } catch (err) {
      console.error("Error marking paid:", err);
    }
  };

  const handleDelete = async (expense) => {
    try {
      await deleteExpense(expense._id);
      setConfirmDelete(null);

      // Clear any existing undo toast
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

      // Show undo toast for 5 seconds
      const timeoutId = setTimeout(() => {
        setUndoToast(null);
      }, UNDO_TIMEOUT_MS);

      undoTimeoutRef.current = timeoutId;
      setUndoToast({ expense });

      refreshAll();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const handleUndo = async () => {
    if (!undoToast) return;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast(null);

    try {
      // Re-create the deleted expense
      const { _id, dateCreated, settled, paidStatus, splitDetails, ...restorable } = undoToast.expense;
      await createExpense(restorable);
      refreshAll();
    } catch (err) {
      console.error("Error restoring expense:", err);
    }
  };

  const dismissUndoToast = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast(null);
  };

  // Active filter chips
  const activeFilters = [];
  if (filters.category !== "all") {
    activeFilters.push({
      key: "category",
      label: filters.category.charAt(0).toUpperCase() + filters.category.slice(1),
      clear: () => setFilters((f) => ({ ...f, category: "all" })),
    });
  }
  if (filters.paidBy !== "all") {
    activeFilters.push({
      key: "paidBy",
      label: `Paid by: ${filters.paidBy}`,
      clear: () => setFilters((f) => ({ ...f, paidBy: "all" })),
    });
  }
  if (filters.sortBy !== "date") {
    activeFilters.push({
      key: "sortBy",
      label: `Sort: ${filters.sortBy.charAt(0).toUpperCase() + filters.sortBy.slice(1)}`,
      clear: () => setFilters((f) => ({ ...f, sortBy: "date" })),
    });
  }
  if (hideSettled) {
    activeFilters.push({
      key: "hideSettled",
      label: "Hiding settled",
      clear: () => setHideSettled(false),
    });
  }

  const visibleExpenses = hideSettled
    ? expenses.filter((e) => !e.settled)
    : expenses;

  const pagedExpenses = visibleExpenses.slice(0, visibleExpenseCount);
  const hasMoreExpenses = visibleExpenseCount < visibleExpenses.length;
  const remainingExpenses = visibleExpenses.length - visibleExpenseCount;

  const allPeople = [
    ...new Set(expenses.flatMap((e) => e.splitBetween || [])),
  ].sort();

  if (!userName) {
    return (
      <main aria-busy="true" className="text-center text-secondary py-5">
        <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Loading</span>
        </div>
        Loading...
      </main>
    );
  }

  return (
    <main aria-label="Single Expenses Tracker">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h2 fw-bold mb-1">
            My Expenses{" "}
            <HelpTooltip
              content={
                <>
                  <strong>How to use Single Expenses:</strong>
                  <br />1. Click &quot;+ New Expense&quot; to log a bill
                  <br />2. Search and add people to split with
                  <br />3. Use filters to find specific expenses
                  <br />4. Check &quot;My Balance&quot; on the right to see who owes you
                  <br />5. Click &quot;Mark Paid&quot; when someone pays their share
                </>
              }
            />
          </h1>
          <p className="text-secondary small mb-0">
            Track one-off expenses, see who owes you, and mark payments as settled.
          </p>
        </div>
        <button
          className="btn btn-primary fw-semibold"
          onClick={() => setShowForm(true)}
          aria-label="Add a new expense"
        >
          + New Expense
        </button>
      </header>

      {/* Quick Stats */}
      {stats && (
        <section aria-label="Spending statistics">
          <div className="d-flex align-items-center gap-2 mb-2">
            <h2 className="h6 fw-bold mb-0">Quick Stats</h2>
            <HelpTooltip
              content="Overview of your spending. 'You Paid' = total you personally paid out-of-pocket. 'You Owe' = total you haven't paid back. 'Owed to You' = total others haven't paid you."
            />
          </div>
          <QuickStats stats={stats} currentUser={userName} expenses={expenses} />
        </section>
      )}

      {/* Filter */}
      <section aria-label="Filter and sort expenses">
        <div className="d-flex align-items-center gap-2 mb-2">
          <h2 className="h6 fw-bold mb-0">Filters</h2>
          <HelpTooltip
            content="Narrow your expense list by category or payer. Use the sort button to reorder by date, amount, or category."
          />
        </div>
        <ExpenseFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          people={allPeople}
          hideSettled={hideSettled}
          onHideSettledChange={handleHideSettledChange}
        />
      </section>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Active filters">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              className="my-expenses__filter-chip btn btn-sm"
              onClick={f.clear}
              aria-label={`Remove filter: ${f.label}`}
            >
              {f.label} <span aria-hidden="true">&times;</span>
            </button>
          ))}
          <button
            className="btn btn-sm btn-link text-secondary p-0 ms-1"
            onClick={() => {
              setFilters({ category: "all", paidBy: "all", sortBy: "date", sortOrder: "desc" });
              setHideSettled(false);
              setVisibleExpenseCount(EXPENSES_PAGE_SIZE);
            }}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="row g-4">
        {/* Left: Expense List */}
        <section className="col-lg-8" aria-label="Expense list">
          {loading ? (
            <div className="text-center text-secondary py-4" aria-busy="true">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading</span>
              </div>
              Loading expenses...
            </div>
          ) : visibleExpenses.length === 0 ? (
            <div className="my-expenses__empty text-center py-5" role="status">
              <p className="fs-1 mb-2">💸</p>
              <p className="fw-semibold mb-1">
                {hideSettled && expenses.length > 0
                  ? "All expenses are settled"
                  : "No expenses yet"}
              </p>
              <p className="text-secondary small">
                {hideSettled && expenses.length > 0
                  ? <>Toggle <strong>&quot;Hide Settled&quot;</strong> off to see your settled expenses.</>
                  : <>Click <strong>&quot;+ New Expense&quot;</strong> above to log your first expense. You can split it with any registered user.</>}
              </p>
            </div>
          ) : (
            <>
              <ol className="list-unstyled" aria-label="Expenses">
                {pagedExpenses.map((exp) => (
                  <li key={exp._id} className="mb-2">
                    <ExpenseCard
                      expense={exp}
                      currentUser={userName}
                      onEdit={() => setEditingExpense(exp)}
                      onDelete={() => setConfirmDelete(exp)}
                      onMarkPaid={() => handleMarkPaid(exp._id)}
                    />
                  </li>
                ))}
              </ol>
              {hasMoreExpenses && (
                <div className="text-center pt-2 pb-3">
                  <p className="text-secondary small mb-2">
                    Showing {pagedExpenses.length} of {visibleExpenses.length} expenses
                  </p>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setVisibleExpenseCount((c) => c + EXPENSES_PAGE_SIZE)}
                  >
                    Load {Math.min(EXPENSES_PAGE_SIZE, remainingExpenses)} more
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right: Sidebar */}
        <aside className="col-lg-4" aria-label="Balance and spending summary">
          <PersonalBalanceSummary balances={balances} />
          {stats && stats.categoryBreakdown && (
            <div className="mt-3">
              <SpendingChart categoryBreakdown={stats.categoryBreakdown} />
            </div>
          )}
        </aside>
      </div>

      {/* Add/Edit Modal */}
      {(showForm || editingExpense) && (
        <div
          className="my-expenses__modal-backdrop"
          onClick={() => { setShowForm(false); setEditingExpense(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={editingExpense ? "Edit expense" : "Add new expense"}
        >
          <div
            className="my-expenses__modal-content bg-white rounded-3 p-4 shadow"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <ExpenseForm
              key={editingExpense?._id ?? `new-expense-${userName}`}
              expense={editingExpense}
              currentUser={userName}
              onSubmit={editingExpense ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingExpense(null); }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="my-expenses__modal-backdrop"
          onClick={() => setConfirmDelete(null)}
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm delete expense"
        >
          <div
            className="bg-white rounded-3 p-4 shadow text-center"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
            ref={deleteModalRef}
            tabIndex={-1}
          >
            <h2 className="h5 text-danger fw-bold">Delete Expense?</h2>
            <p className="text-secondary small">
              This will remove &quot;{confirmDelete.name}&quot; ($
              {confirmDelete.amount.toFixed(2)}). You&apos;ll have 5 seconds to undo.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoToast && (
        <div
          className="my-expenses__undo-toast"
          role="status"
          aria-live="polite"
          aria-label="Expense deleted. Undo available."
        >
          <span className="my-expenses__undo-toast-text">
            &quot;{undoToast.expense.name}&quot; deleted
          </span>
          <button
            className="btn btn-sm btn-warning fw-semibold ms-3"
            onClick={handleUndo}
          >
            Undo
          </button>
          <button
            className="btn btn-sm btn-link text-white ms-1 p-0"
            onClick={dismissUndoToast}
            aria-label="Dismiss"
          >
            &times;
          </button>
          <div className="my-expenses__undo-progress" aria-hidden="true" />
        </div>
      )}
    </main>
  );
}