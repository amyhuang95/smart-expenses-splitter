import PropTypes from "prop-types";

const CATEGORIES = ["all", "food", "transport", "utilities", "entertainment", "other"];

export default function ExpenseFilter({ filters, onFilterChange, people }) {
  const set = (key, val) => onFilterChange({ ...filters, [key]: val });

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        value={filters.category}
        onChange={(e) => set("category", e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        value={filters.paidBy}
        onChange={(e) => set("paidBy", e.target.value)}
      >
        <option value="all">All People</option>
        {people.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        value={filters.sortBy}
        onChange={(e) => set("sortBy", e.target.value)}
      >
        <option value="date">Sort by Date</option>
        <option value="amount">Sort by Amount</option>
        <option value="category">Sort by Category</option>
      </select>

      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={() => set("sortOrder", filters.sortOrder === "desc" ? "asc" : "desc")}
      >
        {filters.sortOrder === "desc" ? "↓" : "↑"}
      </button>
    </div>
  );
}

ExpenseFilter.propTypes = {
  filters: PropTypes.shape({
    category: PropTypes.string.isRequired,
    paidBy: PropTypes.string.isRequired,
    sortBy: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  people: PropTypes.arrayOf(PropTypes.string).isRequired,
};
