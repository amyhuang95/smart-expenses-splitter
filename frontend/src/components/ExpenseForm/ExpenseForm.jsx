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

export default function ExpenseForm({ expense, currentUser, onSubmit, onCancel }) {
  const initial = getInitialFormState(expense, currentUser);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [amount, setAmount] = useState(initial.amount);
  const [category, setCategory] = useState(initial.category);
  const [paidBy, setPaidBy] = useState(initial.paidBy);
  const [splitBetween, setSplitBetween] = useState(initial.splitBetween);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (searchInput.trim().length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      try {
        const data = await searchUsers(searchInput.trim());
        const filtered = data.filter((u) => !splitBetween.includes(u.name));
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
    if (!splitBetween.includes(user.name)) {
      setSplitBetween([...splitBetween, user.name]);
    }
    setSearchInput("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveUser = (userName) => {
    if (userName === currentUser) return;
    setSplitBetween(splitBetween.filter((n) => n !== userName));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      handleSelectUser(searchResults[0]);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const perPerson = splitBetween.length > 0 ? parsedAmount / splitBetween.length : 0;
  const isValid = name.trim() && amount && splitBetween.length >= 2;

  return (
    <form onSubmit={handleSubmit} aria-label={expense ? "Edit expense form" : "New expense form"}>
      <h2 className="h5 fw-bold mb-3">{expense ? "Edit Expense" : "New Expense"}</h2>

      {/* Name */}
      <div className="mb-3">
        <label htmlFor="expense-name" className="form-label small text-secondary">Name</label>
        <input
          id="expense-name"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dinner with Mike"
          required
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label htmlFor="expense-desc" className="form-label small text-secondary">Description (optional)</label>
        <input
          id="expense-desc"
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Split the bill at Mario's"
        />
      </div>

      {/* Amount + Category */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <label htmlFor="expense-amount" className="form-label small text-secondary">Amount ($)</label>
          <input
            id="expense-amount"
            type="number"
            className="form-control"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="col-6">
          <label htmlFor="expense-category" className="form-label small text-secondary">Category</label>
          <select
            id="expense-category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Paid By */}
      <div className="mb-3">
        <label htmlFor="expense-paidby" className="form-label small text-secondary">Who paid for this?</label>
        <select
          id="expense-paidby"
          className="form-select"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {splitBetween.map((p) => (
            <option key={p} value={p}>{p === currentUser ? `${p} (You)` : p}</option>
          ))}
        </select>
      </div>

      {/* Split With */}
      <fieldset className="mb-3">
        <legend className="form-label small text-secondary">Split With</legend>
        <div className="position-relative">
          <input
            className="form-control"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type a name to search registered users"
            aria-label="Search users to split with"
            aria-expanded={showDropdown}
            aria-controls="user-search-results"
            role="combobox"
            autoComplete="off"
          />

          {showDropdown && searchResults.length > 0 && (
            <ul
              id="user-search-results"
              className="list-group position-absolute w-100 shadow-sm"
              style={{ zIndex: 1000, maxHeight: 180, overflowY: "auto" }}
              role="listbox"
              aria-label="Search results"
            >
              {searchResults.map((u) => (
                <li
                  key={u._id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onMouseDown={() => handleSelectUser(u)}
                  role="option"
                  aria-selected={false}
                >
                  <div>
                    <strong>{u.name}</strong>
                    {u.email && <small className="text-secondary ms-2">{u.email}</small>}
                  </div>
                  <span className="badge bg-primary">+ Add</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Participant tags */}
        {splitBetween.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2" aria-label="Selected participants">
            {splitBetween.map((p) => (
              <span key={p} className="expense-form__member-tag">
                {p === currentUser ? `${p} (You)` : p}
                {p !== currentUser && (
                  <button onClick={() => handleRemoveUser(p)} type="button" aria-label={`Remove ${p}`}>
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {splitBetween.length < 2 && (
          <small className="text-danger d-block mt-1" role="alert">
            Add at least one other person to split with
          </small>
        )}
      </fieldset>

      {/* Split preview */}
      {parsedAmount > 0 && splitBetween.length >= 2 && (
        <div className="alert alert-light small mb-3" role="status">
          <strong>Equal split:</strong> ${perPerson.toFixed(2)} per person ({splitBetween.length} people)
        </div>
      )}

      {/* Buttons */}
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary" onClick={onCancel} type="button">Cancel</button>
        <button className="btn btn-primary" type="submit" disabled={!isValid} aria-disabled={!isValid}>
          {expense ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
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
