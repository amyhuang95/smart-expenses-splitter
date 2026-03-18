import PropTypes from "prop-types";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Pagination from "react-bootstrap/Pagination";
import { currency, formatDate } from "../../utils/format.js";
import "./ExpenseList.css";

const PAGE_SIZE = 5;

export default function ExpenseList({
  currentUserId,
  expenses,
  groupOwnerId,
  groupStatus,
  onDelete,
  onEdit,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(expenses.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const visibleExpenses = expenses.slice(
    visibleStart,
    visibleStart + PAGE_SIZE,
  );
  const visibleRangeStart = expenses.length ? visibleStart + 1 : 0;
  const visibleRangeEnd = Math.min(visibleStart + PAGE_SIZE, expenses.length);

  return (
    <Card className="expense-list">
      <Card.Body>
        <Card.Title>Expense Activity ({expenses.length})</Card.Title>
        <Card.Text className="text-muted">
          Recent shared expenses for the group.
        </Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        {expenses.length ? (
          visibleExpenses.map((expense) => (
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
                    <Button
                      onClick={() => onDelete(expense)}
                      size="sm"
                      type="button"
                      variant="outline-danger"
                    >
                      Delete
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
      {expenses.length ? (
        <Card.Footer className="expense-list__footer">
          <div className="expense-list__summary">
            Showing {visibleRangeStart}-{visibleRangeEnd} of {expenses.length}
          </div>
          {totalPages > 1 ? (
            <Pagination className="expense-list__pagination">
              <Pagination.Prev
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              />
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;

                return (
                  <Pagination.Item
                    active={pageNumber === safeCurrentPage}
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
              />
            </Pagination>
          ) : null}
        </Card.Footer>
      ) : null}
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
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
