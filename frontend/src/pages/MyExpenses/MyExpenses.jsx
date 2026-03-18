import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import QuickStats from "../../components/QuickStats/QuickStats.jsx";
import ExpenseFilter from "../../components/ExpenseFilter/ExpenseFilter.jsx";
import ExpenseCard from "../../components/ExpenseCard/ExpenseCard.jsx";
import ExpenseForm from "../../components/ExpenseForm/ExpenseForm.jsx";
import BalanceSummary from "../../components/BalanceSummary/BalanceSummary.jsx";
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

export default function MyExpenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filters, setFilters] = useState({
    category: "all",
    paidBy: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const currentUser = user.name || user.displayName;

  // Fetch all data
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchExpenses(currentUser, filters);
      setExpenses(data);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchExpenseStats(currentUser);
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, [currentUser]);

  const loadBalances = useCallback(async () => {
    try {
      const data = await fetchBalances(currentUser);
      setBalances(data);
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  }, [currentUser]);

  const refreshAll = useCallback(() => {
    loadExpenses();
    loadStats();
    loadBalances();
  }, [loadExpenses, loadStats, loadBalances]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // CRUD handlers
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
      await markExpensePaid(expenseId, currentUser);
      refreshAll();
    } catch (err) {
      console.error("Error marking paid:", err);
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      setConfirmDelete(null);
      refreshAll();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Collect all people from expenses for filter dropdown
  const allPeople = [
    ...new Set(expenses.flatMap((e) => e.splitBetween || [])),
  ];

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

      {/* Main layout */}
      <div className="row g-4">
        {/* Left column: Expense feed */}
        <div className="col-lg-8">
          <ExpenseFilter
            filters={filters}
            onFilterChange={setFilters}
            people={allPeople}
          />

          {loading ? (
            <p className="text-center text-secondary py-4">Loading...</p>
          ) : expenses.length === 0 ? (
            <div className="text-center text-secondary py-5">
              <p className="fs-5 mb-2">No expenses yet</p>
              <p className="small">Click &quot;+ New Expense&quot; to add your first split!</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard
                key={exp._id}
                expense={exp}
                currentUser={currentUser}
                onEdit={() => setEditingExpense(exp)}
                onDelete={() => setConfirmDelete(exp)}
                onMarkPaid={() => handleMarkPaid(exp._id)}
              />
            ))
          )}
        </div>

        {/* Right column: Balance + Chart */}
        <div className="col-lg-4">
          <BalanceSummary balances={balances} />
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
          className="modal-backdrop-custom"
          onClick={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        >
          <div
            className="bg-white rounded-3 p-4 shadow"
            style={{ width: 500, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExpenseForm
              expense={editingExpense}
              currentUser={currentUser}
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
          className="modal-backdrop-custom"
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

MyExpenses.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
  }).isRequired,
};
