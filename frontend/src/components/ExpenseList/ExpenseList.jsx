import PropTypes from "prop-types";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { currency, formatDate } from "../../utils/format.js";
import "./ExpenseList.css";

export default function ExpenseList({
  currentUserId,
  expenses,
  groupOwnerId,
  groupStatus,
  onEdit,
}) {
  return (
    <Card className="expense-list">
      <Card.Body>
        <Card.Title>Expense Activity</Card.Title>
        <Card.Text className="text-muted">
          Recent shared expenses for the group.
        </Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        {expenses.length ? (
          expenses.map((expense) => (
            <ListGroup.Item key={expense._id} className="expense-list__item">
              <div>
                <div className="expense-list__title-row">
                  <strong>{expense.name}</strong>
                  <Badge bg="light" text="dark">
                    {expense.category}
                  </Badge>
                </div>
                <div className="expense-list__meta">
                  Paid by {expense.paidByUser?.name ?? "Member"} on{" "}
                  {formatDate(expense.dateCreated)}
                </div>
                {expense.description ? (
                  <div className="expense-list__description">
                    {expense.description}
                  </div>
                ) : null}
                <div className="expense-list__meta">
                  Split with{" "}
                  {expense.splitBetweenUsers
                    .map((member) => member.name)
                    .join(", ")}
                </div>
                {groupStatus === "open" &&
                (expense.paidBy === currentUserId ||
                  groupOwnerId === currentUserId) ? (
                  <div className="expense-list__actions">
                    <Button
                      onClick={() => onEdit(expense)}
                      size="sm"
                      type="button"
                      variant="outline-dark"
                    >
                      Edit
                    </Button>
                  </div>
                ) : null}
              </div>
              <strong>{currency(expense.amount)}</strong>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>No expenses have been added yet.</ListGroup.Item>
        )}
      </ListGroup>
    </Card>
  );
}

ExpenseList.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
      dateCreated: PropTypes.string.isRequired,
      description: PropTypes.string,
      name: PropTypes.string.isRequired,
      paidBy: PropTypes.string.isRequired,
      paidByUser: PropTypes.shape({
        name: PropTypes.string,
      }),
      splitBetweenUsers: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  groupOwnerId: PropTypes.string.isRequired,
  groupStatus: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
};
