import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { searchUsers } from "../../services/expenses.js";
import "./ExpenseForm.css";

const CATEGORIES = ["food", "transport", "utilities", "entertainment", "other"];

function getInitialFormState(expense, currentUser) {
  if (expense) {
    return {
      name: expense.name,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween || [],
    };
  }

  return {
    name: "",
    description: "",
    amount: "",
    category: "food",
    paidBy: currentUser,
    splitBetween: [currentUser],
  };
}

export default function ExpenseForm({
  expense,
  currentUser,
  onSubmit,
  onCancel,
}) {
  const initialState = getInitialFormState(expense, currentUser);
  const [name, setName] = useState(initialState.name);
  const [description, setDescription] = useState(initialState.description);
  const [amount, setAmount] = useState(initialState.amount);
  const [category, setCategory] = useState(initialState.category);
  const [paidBy, setPaidBy] = useState(initialState.paidBy);
  const [splitBetween, setSplitBetween] = useState(initialState.splitBetween);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search users as they type — uses GET /api/users/search?q=xxx
  useEffect(() => {
    const doSearch = async () => {
      if (searchInput.trim().length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      try {
        const data = await searchUsers(searchInput.trim());
        // Filter out users already in splitBetween (match by name)
        const filtered = data.filter(
          (u) => !splitBetween.includes(u.name),
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
        setShowDropdown(false);
      }
    };
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [searchInput, splitBetween]);

  const handleSelectUser = (user) => {
    // Store by name (consistent with how currentUser is stored)
    if (!splitBetween.includes(user.name)) {
      setSplitBetween([...splitBetween, user.name]);
    }
    setSearchInput("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveUser = (userName) => {
    if (userName === currentUser) return; // can't remove yourself
    setSplitBetween(splitBetween.filter((n) => n !== userName));
  };

  const handleSubmit = () => {
    if (!name.trim() || !amount || !paidBy || splitBetween.length < 2) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      paidBy,
      splitBetween,
    });
  };

  const parsedAmount = parseFloat(amount) || 0;
  const perPerson =
    splitBetween.length > 0 ? parsedAmount / splitBetween.length : 0;

  return (
    <div>
      <h5 className="mb-3">{expense ? "Edit Expense" : "New Expense"}</h5>

      {/* Name */}
      <div className="mb-3">
        <label className="form-label small text-secondary">Name</label>
        <input
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dinner with Mike"
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label small text-secondary">
          Description (optional)
        </label>
        <input
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Split the bill at Mario's"
        />
      </div>

      {/* Amount + Category */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <label className="form-label small text-secondary">Amount ($)</label>
          <input
            type="number"
            className="form-control"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="col-6">
          <label className="form-label small text-secondary">Category</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Paid By */}
      <div className="mb-3">
        <label className="form-label small text-secondary">Paid By</label>
        <select
          className="form-select"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {splitBetween.map((p) => (
            <option key={p} value={p}>
              {p === currentUser ? `${p} (You)` : p}
            </option>
          ))}
        </select>
      </div>

      {/* Split With — search registered users */}
      <div className="mb-3">
        <label className="form-label small text-secondary">Split With</label>
        <div className="position-relative">
          <input
            className="form-control"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search registered users to split with"
          />

          {/* Search results dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <ul
              className="list-group position-absolute w-100 shadow"
              style={{ zIndex: 1000, maxHeight: 180, overflowY: "auto" }}
            >
              {searchResults.map((u) => (
                <li
                  key={u._id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onMouseDown={() => handleSelectUser(u)}
                >
                  <div>
                    <strong>{u.name}</strong>
                    {u.email && (
                      <small className="text-secondary ms-2">{u.email}</small>
                    )}
                  </div>
                  <span className="badge bg-primary">+ Add</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Participant tags */}
        {splitBetween.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {splitBetween.map((p) => (
              <span key={p} className="expense-form__member-tag">
                {p === currentUser ? `${p} (You)` : p}
                {p !== currentUser && (
                  <button onClick={() => handleRemoveUser(p)} type="button">
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {splitBetween.length < 2 && (
          <small className="text-danger">Add at least one other person</small>
        )}
      </div>

      {/* Split preview */}
      {parsedAmount > 0 && splitBetween.length >= 2 && (
        <div className="alert alert-light small mb-3">
          <strong>Equal split:</strong> ${perPerson.toFixed(2)} per person (
          {splitBetween.length} people)
        </div>
      )}

      {/* Buttons */}
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!name.trim() || !amount || splitBetween.length < 2}
          type="button"
        >
          {expense ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </div>
  );
}

ExpenseForm.propTypes = {
  expense: PropTypes.object,
  currentUser: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ExpenseForm.defaultProps = {
  expense: null,
};
