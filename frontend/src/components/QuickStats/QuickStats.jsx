import PropTypes from "prop-types";


export default function QuickStats({ stats }) {
  const items = [
    ["Total Spent", `$${stats.totalSpending.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
    ["Avg Expense", `$${stats.avgExpense.toFixed(2)}`],
    ["Expenses", stats.expenseCount],
    ["You Owe", `$${stats.youOwe.toFixed(2)}`],
    ["Owed to You", `$${stats.owedToYou.toFixed(2)}`],
  ];

  return (
    <div className="row g-3 mb-4">
      {items.map(([label, val]) => (
        <div key={label} className="col">
          <div className="card">
            <div className="card-body py-2 text-center">
              <small className="text-secondary text-uppercase" style={{ fontSize: "0.7rem" }}>
                {label}
              </small>
              <div className="fw-bold fs-5">{val}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

QuickStats.propTypes = {
  stats: PropTypes.shape({
    totalSpending: PropTypes.number.isRequired,
    avgExpense: PropTypes.number.isRequired,
    expenseCount: PropTypes.number.isRequired,
    youOwe: PropTypes.number.isRequired,
    owedToYou: PropTypes.number.isRequired,
  }).isRequired,
};
