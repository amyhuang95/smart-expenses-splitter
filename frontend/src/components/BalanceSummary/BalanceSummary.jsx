import PropTypes from "prop-types";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import "./BalanceSummary.css";

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
  isSubmitting,
  onMarkPaid,
}) {
  return (
    <Card className="balance-summary">
      <Card.Body>
        <Card.Title>Who Owes Whom</Card.Title>
        <Card.Text className="text-muted">
          Review the current settlement plan for this group.
        </Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        {debts.length ? (
          debts.map((debt) => {
            const canMarkPaid =
              !debt.isPaid &&
              currentUserId === debt.senderId &&
              groupStatus !== "open";

            return (
              <ListGroup.Item
                key={debt.debtId}
                className="balance-summary__item"
              >
                <div>
                  <strong>{debt.sender?.name ?? "Member"}</strong> owes{" "}
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
          <ListGroup.Item>No balances to settle.</ListGroup.Item>
        )}
      </ListGroup>
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
  isSubmitting: PropTypes.bool.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
};
