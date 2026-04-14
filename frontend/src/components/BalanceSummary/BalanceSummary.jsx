import PropTypes from "prop-types";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import HelpTooltip from "../HelpTooltip/HelpTooltip.jsx";

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
  isOwner,
  isSettling,
  isSubmitting,
  onMarkPaid,
  onSettleUp,
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
    <Card className="rounded-4" style={{ overflow: "visible" }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Card.Title className="mb-0">Settlement Plan</Card.Title>
            <HelpTooltip
            position="right"
            content={
              <>
                <strong>How settlements work:</strong>
                <br />
                1. Each row shows who owes whom and how much.
                <br />
                2. The group owner must click &quot;Settle Up&quot; before debts can be marked as paid.
                <br />
                3. Once settling, the sender, receiver, or group owner can click &quot;Mark Paid&quot; to confirm a payment.
              </>
            }
            />
          </div>
          {isOwner && onSettleUp ? (
            <Button
              disabled={isSettling || groupStatus !== "open"}
              onClick={onSettleUp}
              size="sm"
              type="button"
              variant="primary"
            >
              {isSettling ? "Settling\u2026" : "Settle Up"}
            </Button>
          ) : null}
        </div>
        <div
          aria-label="Filter settlements"
          className="d-flex flex-wrap gap-2 mt-3"
          role="group"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              aria-pressed={statusFilter === option.value}
              className={`btn btn-sm rounded-pill ${
                statusFilter === option.value ? "btn-primary" : "btn-light"
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
      <div style={{ maxHeight: "28rem", overflowY: "auto", borderTop: "1px solid rgba(0,0,0,.125)", borderRadius: "0 0 var(--bs-card-border-radius) var(--bs-card-border-radius)" }}>
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
                  className="d-flex align-items-center justify-content-between gap-3"
                >
                  <div>
                    <strong>{debt.sender?.name ?? "Member"}</strong> →{" "}
                    <strong>{debt.receiver?.name ?? "Member"}</strong>
                    <div className="text-secondary mt-1">
                      {currency(debt.amount)}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {debt.isPaid ? (
                      <Badge bg="success">Paid</Badge>
                    ) : null}
                    {canMarkPaid ? (
                      <button
                        className="btn btn-outline-success btn-sm py-0 px-2 ms-1"
                        disabled={isSubmitting}
                        onClick={() => onMarkPaid(debt.debtId)}
                        style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                        type="button"
                      >
                        Mark Paid
                      </button>
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
  isOwner: PropTypes.bool,
  isSettling: PropTypes.bool,
  isSubmitting: PropTypes.bool.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  onSettleUp: PropTypes.func,
};
