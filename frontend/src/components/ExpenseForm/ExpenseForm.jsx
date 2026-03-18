import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CATEGORIES = ["food", "transport", "utilities", "entertainment", "other"];

export default function ExpenseForm({ expense, currentUser, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Populate form for editing
  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setDescription(expense.description || "");
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setPaidBy(expense.paidBy);
      setSplitBetween(expense.splitBetween || []);
    } else {
      setPaidBy(currentUser);
      setSplitBetween([currentUser]);
    }
  }, [expense, currentUser]);

  // Search users as they type
  useEffect(() => {
    const searchUsers = async () => {
      if (searchInput.trim().length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/users?search=${encodeURIComponent(searchInput.trim())}`,
        );
        const data = await res.json();
        // Filter out users already in splitBetween
        const filtered = data.filter(
          (u) => !splitBetween.includes(u.name) && !splitBetween.includes(u._id),
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchInput, splitBetween]);

  const handleSelectUser = (user) => {
    const userId = user._id || user.name;
    if (!splitBetween.includes(userId)) {
      setSplitBetween([...splitBetween, userId]);
    }
    setSearchInput("");
    setShowDropdown(false);
  };

  const handleRemoveUser = (userId) => {
    if (userId === currentUser) return; // can't remove yourself
    setSplitBetween(splitBetween.filter((id) => id !== userId));
  };

  const handleSubmit = () => {
    if (!name.trim() || !amount || !paidBy || splitBetween.length === 0) return;
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
  const perPerson = splitBetween.length > 0
    ? (parsedAmount / splitBetween.length).toFixed(2)
    : "0.00";

  return (
    <div>
      <h4 className="mb-3">{expense ? "Edit Expense" : "New Expense"}</h4>

      <div className="mb-3">
        <label className="form-label small text-secondary">Name</label>
        <input
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dinner with Mike"
        />
      </div>

      <div className="mb-3">
        <label className="form-label small text-secondary">Description (optional)</label>
        <input
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Split the bill at Mario's"
        />
      </div>

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

      <div className="mb-3">
        <label className="form-label small text-secondary">Paid By</label>
        {splitBetween.length > 0 ? (
          <select
            className="form-select"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {splitBetween.map((p) => (
              <option key={p} value={p}>{p === currentUser ? `${p} (You)` : p}</option>
            ))}
          </select>
        ) : (
          <input
            className="form-control"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            placeholder="Who paid?"
          />
        )}
      </div>

      {/* Split with — search users */}
      <div className="mb-3">
        <label className="form-label small text-secondary">Split With</label>
        <div className="position-relative">
          <input
            className="form-control"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search users to add..."
          />
          {showDropdown && searchResults.length > 0 && (
            <ul
              className="list-group position-absolute w-100 shadow"
              style={{ zIndex: 1000, maxHeight: 180, overflowY: "auto" }}
            >
              {searchResults.map((u) => (
                <li
                  key={u._id}
                  className="list-group-item list-group-item-action d-flex justify-content-between"
                  style={{ cursor: "pointer" }}
                  onMouseDown={() => handleSelectUser(u)}
                >
                  <span>
                    <strong>{u.name}</strong>
                    {u.email && <small className="text-secondary ms-2">{u.email}</small>}
                  </span>
                  <span className="badge bg-primary">+ Add</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <small className="text-secondary">Search registered users to split with</small>
      </div>

      {/* Selected participants */}
      {splitBetween.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {splitBetween.map((p) => (
            <span key={p} className="member-tag">
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

      {/* Split preview */}
      {splitBetween.length > 0 && parsedAmount > 0 && (
        <div className="alert alert-light small">
          <strong>Each pays:</strong> ${perPerson} per person ({splitBetween.length} people)
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 mt-3">
        <button className="btn btn-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!name.trim() || !amount || !paidBy || splitBetween.length === 0}
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
