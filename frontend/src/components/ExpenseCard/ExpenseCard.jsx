import PropTypes from "prop-types";
import "./ExpenseCard.css";

const ICONS = {
  food: "🍔",
  transport: "🚗",
  utilities: "💡",
  entertainment: "🎬",
  other: "📦",
};

export default function ExpenseCard({ expense, currentUser, onEdit, onDelete, onMarkPaid }) {
  const date = new Date(expense.dateCreated).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const icon = ICONS[expense.category] || "📦";
  const isPayer = expense.paidBy === currentUser;
  const myPaid = expense.paidStatus?.[currentUser] || false;
  const canMarkPaid = !expense.settled && !isPayer && !myPaid;

  return (
    <div className={`card mb-2 ${expense.settled ? "opacity-50" : ""}`}>
      <div className="card-body py-2">
        {/* Top row: icon + name + amount */}
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="fs-4">{icon}</span>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between">
              <strong>{expense.name}</strong>
              <span className="fw-bold">${expense.amount.toFixed(2)}</span>
            </div>
            <small className="text-secondary">
              Paid by <strong>{isPayer ? "You" : expense.paidBy}</strong>
              {" · "}
              <span className={`expense-card__category--${expense.category}`}>{expense.category}</span>
              {" · "}
              {date}
              {expense.settled && <span className="badge bg-success ms-2">Settled</span>}
            </small>
          </div>
        </div>

        {/* Per-person split details */}
        <div className="ms-5 mb-2">
          {expense.splitBetween
            .filter((p) => p !== expense.paidBy)
            .map((person) => {
              const share = expense.splitDetails?.[person] || 0;
              const paid = expense.paidStatus?.[person] || false;
              const isMe = person === currentUser;

              return (
                <div key={person} className="d-flex align-items-center gap-2 small">
                  <span className={paid ? "text-success" : "text-danger"}>
                    {isMe ? "You" : person}
                  </span>
                  <span className="text-secondary">${share.toFixed(2)}</span>
                  {paid ? (
                    <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>Paid ✓</span>
                  ) : (
                    <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>Unpaid</span>
                  )}
                  {/* Show Mark Paid button only for current user's own unpaid share */}
                  {isMe && canMarkPaid && (
                    <button
                      className="btn btn-outline-success btn-sm py-0 px-2 ms-1"
                      style={{ fontSize: "0.7rem" }}
                      onClick={onMarkPaid}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Action buttons */}
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={onEdit}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="btn btn-sm btn-outline-danger py-0 px-2"
            onClick={onDelete}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

ExpenseCard.propTypes = {
  expense: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    paidBy: PropTypes.string.isRequired,
    splitBetween: PropTypes.arrayOf(PropTypes.string).isRequired,
    splitDetails: PropTypes.object,
    paidStatus: PropTypes.object,
    settled: PropTypes.bool,
    dateCreated: PropTypes.string.isRequired,
  }).isRequired,
  currentUser: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
};
