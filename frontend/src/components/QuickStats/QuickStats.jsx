import PropTypes from "prop-types";
import "./QuickStats.css";

export default function QuickStats({ stats }) {
  const items = [
    { label: "Total Spent", value: `$${stats.totalSpending.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "" },
    { label: "Avg Expense", value: `$${stats.avgExpense.toFixed(2)}`, colorClass: "" },
    { label: "Expenses", value: stats.expenseCount, colorClass: "" },
    { label: "You Owe", value: `$${stats.youOwe.toFixed(2)}`, colorClass: stats.youOwe > 0 ? "text-danger" : "" },
    { label: "Owed to You", value: `$${stats.owedToYou.toFixed(2)}`, colorClass: stats.owedToYou > 0 ? "text-success" : "" },
  ];

  return (
    <dl className="row g-3 mb-4" role="region" aria-label="Quick spending statistics">
      {items.map(({ label, value, colorClass }) => (
        <div key={label} className="col">
          <div className="card">
            <div className="card-body py-2 text-center">
              <dt className="quick-stats__label">{label}</dt>
              <dd className={`quick-stats__value ${colorClass}`}>{value}</dd>
            </div>
          </div>
        </div>
      ))}
    </dl>
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
