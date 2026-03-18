import PropTypes from "prop-types";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import "./BalanceSummary.css";

const FILTER = {
  ALL: "all",
  PAID: "paid",
  PENDING: "pending",
};

const FILTER_OPTIONS = [
  { label: "All", value: FILTER.ALL },
  { label: "Pending", value: FILTER.PENDING },
  { label: "Paid", value: FILTER.PAID },
];

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
}

export default function BalanceSummary({
  currentUserId,
  debts,
  groupStatus,
  groupOwnerId,
  isSubmitting,
  onMarkPaid,
}) {
  const [statusFilter, setStatusFilter] = useState(FILTER.ALL);
  const filteredDebts = debts.filter((debt) => {
    if (statusFilter === FILTER.PAID) {
      return debt.isPaid;
    }

    if (statusFilter === FILTER.PENDING) {
      return !debt.isPaid;
    }

    return true;
  });
  const emptyLabel =
    statusFilter === FILTER.ALL
      ? "No balances to settle."
      : `No ${statusFilter} balances found.`;

  return (
    <Card className="balance-summary">
      <Card.Body>
        <Card.Title>Settlement Plan</Card.Title>
        <div
          aria-label="Filter settlements"
          className="balance-summary__filter"
          role="group"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              aria-pressed={statusFilter === option.value}
              className={`balance-summary__filter-tag${
                statusFilter === option.value
                  ? " balance-summary__filter-tag--active"
                  : ""
              }`}
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card.Body>
      <div className="balance-summary__list">
        <ListGroup variant="flush">
          {filteredDebts.length ? (
            filteredDebts.map((debt) => {
              const canMarkPaid =
                !debt.isPaid &&
                (currentUserId === debt.senderId ||
                  currentUserId === debt.receiverId ||
                  currentUserId === groupOwnerId) &&
                groupStatus !== "open";

              return (
                <ListGroup.Item
                  key={debt.debtId}
                  className="balance-summary__item"
                >
                  <div>
                    <strong>{debt.sender?.name ?? "Member"}</strong> →{" "}
                    <strong>{debt.receiver?.name ?? "Member"}</strong>
                    <div className="balance-summary__meta">
                      {currency(debt.amount)}
                    </div>
                  </div>
                  <div className="balance-summary__actions">
                    <Badge bg={debt.isPaid ? "success" : "warning"}>
                      {debt.isPaid ? "Paid" : "Pending"}
                    </Badge>
                    {canMarkPaid ? (
                      <Button
                        disabled={isSubmitting}
                        onClick={() => onMarkPaid(debt.debtId)}
                        size="sm"
                        type="button"
                        variant="outline-dark"
                      >
                        Mark Paid
                      </Button>
                    ) : null}
                  </div>
                </ListGroup.Item>
              );
            })
          ) : (
            <ListGroup.Item>{emptyLabel}</ListGroup.Item>
          )}
        </ListGroup>
      </div>
    </Card>
  );
}

BalanceSummary.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  debts: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number.isRequired,
      debtId: PropTypes.string.isRequired,
      isPaid: PropTypes.bool.isRequired,
      receiver: PropTypes.shape({
        name: PropTypes.string,
      }),
      receiverId: PropTypes.string.isRequired,
      sender: PropTypes.shape({
        name: PropTypes.string,
      }),
      senderId: PropTypes.string.isRequired,
    }),
  ).isRequired,
  groupStatus: PropTypes.string.isRequired,
  groupOwnerId: PropTypes.string.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
};
