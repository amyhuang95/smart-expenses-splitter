import PropTypes from "prop-types";
import "./ExpenseFilter.css";

const CATEGORIES = [
  "all",
  "food",
  "transport",
  "utilities",
  "entertainment",
  "other",
];

export default function ExpenseFilter({
  filters,
  onFilterChange,
  people,
  hideSettled,
  onHideSettledChange,
}) {
  const set = (key, val) => onFilterChange({ ...filters, [key]: val });

  const sortLabel =
    filters.sortOrder === "desc"
      ? "\u2193 High\u2192Low"
      : "\u2191 Low\u2192High";

  return (
    <nav
      className="d-flex flex-wrap gap-2 mb-3"
      aria-label="Filter and sort expenses"
    >
      <label htmlFor="filter-category" className="visually-hidden">
        Filter by category
      </label>
      <select
        id="filter-category"
        className="form-select form-select-sm w-auto"
        value={filters.category}
        onChange={(e) => set("category", e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all"
              ? "All Categories"
              : c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>

      <label htmlFor="filter-paidby" className="visually-hidden">
        Filter by payer
      </label>
      <select
        id="filter-paidby"
        className="form-select form-select-sm w-auto"
        value={filters.paidBy}
        onChange={(e) => set("paidBy", e.target.value)}
      >
        <option value="all">All People</option>
        {people.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <label htmlFor="filter-sort" className="visually-hidden">
        Sort by
      </label>
      <select
        id="filter-sort"
        className="form-select form-select-sm w-auto"
        value={filters.sortBy}
        onChange={(e) => set("sortBy", e.target.value)}
      >
        <option value="date">Sort by Date</option>
        <option value="amount">Sort by Amount</option>
        <option value="category">Sort by Category</option>
      </select>

      <button
        className="btn btn-outline-secondary btn-sm expense-filter__sort-btn"
        onClick={() =>
          set("sortOrder", filters.sortOrder === "desc" ? "asc" : "desc")
        }
        aria-label={`Sort direction: ${sortLabel}. Click to reverse.`}
        title={sortLabel}
      >
        {sortLabel}
      </button>

      {/* Hide Settled toggle */}
      <div className="form-check form-switch d-flex align-items-center mb-0 ms-1">
        <input
          className="form-check-input me-2"
          type="checkbox"
          role="switch"
          id="hide-settled-toggle"
          checked={hideSettled}
          onChange={(e) => onHideSettledChange(e.target.checked)}
        />
        <label className="form-check-label small" htmlFor="hide-settled-toggle">
          Hide Settled
        </label>
      </div>
    </nav>
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
  hideSettled: PropTypes.bool.isRequired,
  onHideSettledChange: PropTypes.func.isRequired,
};
