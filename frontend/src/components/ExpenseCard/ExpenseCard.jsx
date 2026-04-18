import PropTypes from "prop-types";
import "./ExpenseCard.css";

const ICONS = {
  food: "\uD83C\uDF54",
  transport: "\uD83D\uDE97",
  utilities: "\uD83D\uDCA1",
  entertainment: "\uD83C\uDFAC",
  other: "\uD83D\uDCE6",
};

const CATEGORY_LABELS = {
  food: "Food",
  transport: "Transport",
  utilities: "Utilities",
  entertainment: "Entertainment",
  other: "Other",
};

export default function ExpenseCard({
  expense,
  currentUser,
  onEdit,
  onDelete,
  onMarkPaid,
}) {
  const date = new Date(expense.dateCreated).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const icon = ICONS[expense.category] || ICONS.other;
  const categoryLabel = CATEGORY_LABELS[expense.category] || "Other";
  const isPayer = expense.paidBy === currentUser;
  const myPaid = expense.paidStatus?.[currentUser] || false;
  const canMarkPaid = !expense.settled && !isPayer && !myPaid;

  return (
    <article
      className={`card expense-card ${expense.settled ? "expense-card--settled" : ""}`}
      aria-label={`${expense.name}, $${expense.amount.toFixed(2)}, ${categoryLabel}`}
    >
      <div className="card-body py-2">
        {/* Top row */}
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="fs-4" aria-hidden="true">{icon}</span>
          <div className="flex-grow-1 min-width-0">
            <div className="d-flex justify-content-between align-items-baseline">
              <h3 className="fs-6 fw-bold mb-0 text-truncate">{expense.name}</h3>
              <span className="fw-bold text-nowrap">${expense.amount.toFixed(2)}</span>
            </div>
            <p className="small text-secondary mb-0">
              Paid by <strong>{isPayer ? "You" : expense.paidBy}</strong>
              <span aria-hidden="true"> &middot; </span>
              <span className={`expense-card__category--${expense.category}`}>{categoryLabel}</span>
              <span aria-hidden="true"> &middot; </span>
              <time dateTime={expense.dateCreated}>{date}</time>
              {expense.settled && (
                <span className="badge bg-success ms-2">Settled</span>
              )}
            </p>
          </div>
        </div>

        {/* Per-person split */}
        <div className="ms-5 mb-2">
          <p className="expense-card__hint">
            Only the person who owes can mark their own share as paid.
          </p>
          {expense.splitBetween
            .filter((p) => p !== expense.paidBy)
            .map((person) => {
              const share = expense.splitDetails?.[person] || 0;
              const paid = expense.paidStatus?.[person] || false;
              const isMe = person === currentUser;

              return (
                <div key={person} className="d-flex align-items-center gap-2 small mb-1">
                  <span className={paid ? "text-success" : "text-danger"}>
                    {isMe ? "You" : person}
                  </span>
                  <span className="text-secondary">${share.toFixed(2)}</span>
                  {paid ? (
                    <span className="badge bg-success expense-card__badge">Paid</span>
                  ) : (
                    <span className="badge bg-warning text-dark expense-card__badge">Unpaid</span>
                  )}
                  {isMe && canMarkPaid && (
                    <button
                      className="btn btn-outline-success btn-sm expense-card__mark-btn"
                      onClick={onMarkPaid}
                      aria-label={`Mark your $${share.toFixed(2)} share as paid`}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Actions — larger buttons with text labels */}
        <div className="d-flex justify-content-end gap-2 border-top pt-2">
          <button
            className="btn btn-sm btn-outline-secondary expense-card__action-btn d-flex align-items-center gap-1"
            onClick={onEdit}
            aria-label={`Edit ${expense.name}`}
          >
            <span aria-hidden="true">&#9998;</span> Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger expense-card__action-btn d-flex align-items-center gap-1"
            onClick={onDelete}
            aria-label={`Delete ${expense.name}`}
          >
            <span aria-hidden="true">&#128465;</span> Delete
          </button>
        </div>
      </div>
    </article>
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
