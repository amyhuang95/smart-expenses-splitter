import PropTypes from "prop-types";
import "./QuickStats.css";

export default function QuickStats({ stats, currentUser, expenses }) {
  // Calculate how much the current user personally paid out-of-pocket
  const youPaid = expenses
    ? expenses
        .filter((e) => e.paidBy === currentUser)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    : (stats.youPaid ?? 0);

  const items = [
    {
      label: "You Paid",
      value: `$${youPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      colorClass: youPaid > 0 ? "text-primary" : "",
      title: "Total you personally paid out-of-pocket",
    },
    {
      label: "Avg Expense",
      value: `$${stats.avgExpense.toFixed(2)}`,
      colorClass: "",
    },
    {
      label: "Expenses",
      value: stats.expenseCount,
      colorClass: "",
    },
    {
      label: "You Owe",
      value: `$${stats.youOwe.toFixed(2)}`,
      colorClass: stats.youOwe > 0 ? "text-danger" : "",
    },
    {
      label: "Owed to You",
      value: `$${stats.owedToYou.toFixed(2)}`,
      colorClass: stats.owedToYou > 0 ? "text-success" : "",
    },
  ];

  return (
    <div
      className="row g-3 mb-4"
      role="region"
      aria-label="Quick spending statistics"
    >
      {items.map(({ label, value, colorClass, title }) => (
        <div key={label} className="col">
          <div className="card" title={title}>
            <dl className="card-body py-2 text-center mb-0">
              <dt className="quick-stats__label">{label}</dt>
              <dd className={`quick-stats__value ${colorClass}`}>{value}</dd>
            </dl>
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
    youPaid: PropTypes.number,
  }).isRequired,
  currentUser: PropTypes.string,
  expenses: PropTypes.array,
};
