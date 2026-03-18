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
const SPLIT_MEMBER_PREVIEW_LIMIT = 6;
const CATEGORY_FILTER_ALL = "all";

export default function ExpenseList({
  currentUserId,
  expenses,
  groupOwnerId,
  groupStatus,
  onDelete,
  onEdit,
}) {
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const categoryOptions = [
    CATEGORY_FILTER_ALL,
    ...new Set(expenses.map((expense) => expense.category)),
  ];
  const filteredExpenses =
    categoryFilter === CATEGORY_FILTER_ALL
      ? expenses
      : expenses.filter((expense) => expense.category === categoryFilter);
  const totalPages = Math.max(Math.ceil(filteredExpenses.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const visibleExpenses = filteredExpenses.slice(
    visibleStart,
    visibleStart + PAGE_SIZE,
  );
  const visibleRangeStart = filteredExpenses.length ? visibleStart + 1 : 0;
  const visibleRangeEnd = Math.min(
    visibleStart + PAGE_SIZE,
    filteredExpenses.length,
  );

  function formatSplitMembers(members) {
    if (members.length <= SPLIT_MEMBER_PREVIEW_LIMIT) {
      return members.map((member) => member.name).join(", ");
    }

    const visibleMembers = members
      .slice(0, SPLIT_MEMBER_PREVIEW_LIMIT)
      .map((member) => member.name)
      .join(", ");
    const hiddenMemberCount = members.length - SPLIT_MEMBER_PREVIEW_LIMIT;
    const hiddenMemberLabel = hiddenMemberCount === 1 ? "person" : "people";

    return `${visibleMembers}, and ${hiddenMemberCount} ${hiddenMemberLabel}`;
  }

  function formatCategoryLabel(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  return (
    <Card className="expense-list">
      <Card.Body>
        <Card.Title>Expense Activity ({expenses.length})</Card.Title>
        <div aria-label="Filter expenses by category" className="expense-list__filter" role="group">
          {categoryOptions.map((category) => (
            <button
              aria-pressed={categoryFilter === category}
              className={`expense-list__filter-tag${
                categoryFilter === category
                  ? " expense-list__filter-tag--active"
                  : ""
              }`}
              key={category}
              onClick={() => {
                setCategoryFilter(category);
                setCurrentPage(1);
              }}
              type="button"
            >
              {category === CATEGORY_FILTER_ALL ? "All" : category}
            </button>
          ))}
        </div>
      </Card.Body>
      <ListGroup variant="flush">
        {filteredExpenses.length ? (
          visibleExpenses.map((expense) => (
            <ListGroup.Item key={expense._id} className="expense-list__item">
              <div>
                <div className="expense-list__title-row">
                  <strong>{expense.name}</strong>
                  <Badge bg="light" text="dark">
                    {formatCategoryLabel(expense.category)}
                  </Badge>
                </div>
                <div className="expense-list__meta">
                  Paid by {expense.paidByUser?.name ?? "Member"} on{" "}
                  {formatDate(expense.dateCreated)}
                </div>
                <div className="expense-list__meta">
                  Split with {formatSplitMembers(expense.splitBetweenUsers)}
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
          <ListGroup.Item>
            {categoryFilter === CATEGORY_FILTER_ALL
              ? "No expenses have been added yet."
              : `No ${categoryFilter} expenses found.`}
          </ListGroup.Item>
        )}
      </ListGroup>
      {filteredExpenses.length ? (
        <Card.Footer className="expense-list__footer">
          <div className="expense-list__summary">
            Showing {visibleRangeStart}-{visibleRangeEnd} of{" "}
            {filteredExpenses.length}
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
