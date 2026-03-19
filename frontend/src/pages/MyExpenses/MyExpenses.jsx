import { useState, useEffect, useCallback } from "react";
import { useUser } from "../../context/useUser.js";
import QuickStats from "../../components/QuickStats/QuickStats.jsx";
import ExpenseFilter from "../../components/ExpenseFilter/ExpenseFilter.jsx";
import ExpenseCard from "../../components/ExpenseCard/ExpenseCard.jsx";
import ExpenseForm from "../../components/ExpenseForm/ExpenseForm.jsx";
import PersonalBalanceSummary from "../../components/PersonalBalanceSummary/PersonalBalanceSummary.jsx";
import SpendingChart from "../../components/SpendingChart/SpendingChart.jsx";
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


export default function MyExpenses() {
  const { user } = useUser();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    paidBy: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const userName = user?.name;

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
  }, [refreshAll]);

  // CREATE
  const handleCreate = async (data) => {
    try {
      await createExpense(data);
      setShowForm(false);
      refreshAll();
    } catch (err) {
      console.error("Error creating expense:", err);
    }
  };

  // UPDATE
  const handleUpdate = async (data) => {
    try {
      await updateExpense(editingExpense._id, data);
      setEditingExpense(null);
      refreshAll();
    } catch (err) {
      console.error("Error updating expense:", err);
    }
  };

  // MARK PAID
  const handleMarkPaid = async (expenseId) => {
    try {
      await markExpensePaid(expenseId, userName);
      refreshAll();
    } catch (err) {
      console.error("Error marking paid:", err);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      setConfirmDelete(null);
      refreshAll();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Collect all people from expenses for filter dropdown
  const allPeople = [
    ...new Set(expenses.flatMap((e) => e.splitBetween || [])),
  ].sort();

  if (!userName) {
    return <p className="text-center text-secondary py-5">Loading...</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My Expenses</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + New Expense
        </button>
      </div>

      {/* Quick Stats */}
      {stats && <QuickStats stats={stats} />}

      {/* Filter */}
      <ExpenseFilter
        filters={filters}
        onFilterChange={setFilters}
        people={allPeople}
      />

      <div className="row g-4">
        {/* Left: Expense List */}
        <div className="col-lg-8">
          {loading ? (
            <p className="text-center text-secondary py-4">Loading...</p>
          ) : expenses.length === 0 ? (
            <div className="text-center text-secondary py-5">
              <p className="mb-2">No expenses yet.</p>
              <p className="small">
                Click &quot;+ New Expense&quot; to add your first one!
              </p>
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard
                key={exp._id}
                expense={exp}
                currentUser={userName}
                onEdit={() => setEditingExpense(exp)}
                onDelete={() => setConfirmDelete(exp)}
                onMarkPaid={() => handleMarkPaid(exp._id)}
              />
            ))
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="col-lg-4">
          <PersonalBalanceSummary balances={balances} />
          {stats && stats.categoryBreakdown && (
            <div className="mt-3">
              <SpendingChart categoryBreakdown={stats.categoryBreakdown} />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showForm || editingExpense) && (
        <div
          className="my-expenses__modal-backdrop"
          onClick={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        >
          <div
            className="bg-white rounded-3 p-4 shadow"
            style={{ width: 480, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExpenseForm
              expense={editingExpense}
              currentUser={userName}
              onSubmit={editingExpense ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingExpense(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="my-expenses__modal-backdrop"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-3 p-4 shadow text-center"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5>Delete Expense?</h5>
            <p className="text-secondary small">
              Delete &quot;{confirmDelete.name}&quot; ($
              {confirmDelete.amount.toFixed(2)})?
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
