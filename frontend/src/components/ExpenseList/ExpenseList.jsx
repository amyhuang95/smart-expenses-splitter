import PropTypes from "prop-types";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Pagination from "react-bootstrap/Pagination";
import { currency, formatDate } from "../../utils/format.js";

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

  const canEdit = (expense) =>
    groupStatus === "open" &&
    (expense.paidBy === currentUserId || groupOwnerId === currentUserId);

  return (
    <Card className="rounded-4 overflow-hidden">
      <Card.Body>
        <Card.Title>Expense Activity ({expenses.length})</Card.Title>
        <div
          aria-label="Filter expenses by category"
          className="d-flex flex-wrap gap-2 mt-3"
          role="group"
        >
          {categoryOptions.map((category) => (
            <button
              aria-pressed={categoryFilter === category}
              className={`btn btn-sm rounded-pill ${
                categoryFilter === category ? "btn-primary" : "btn-light"
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
            <ListGroup.Item
              key={expense._id}
              className="d-flex justify-content-between align-items-start gap-3"
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <strong>{expense.name}</strong>
                  <Badge bg="light" text="dark">
                    {formatCategoryLabel(expense.category)}
                  </Badge>
                </div>
                <div className="text-secondary small mt-1">
                  Paid by {expense.paidByUser?.name ?? "Member"} on{" "}
                  {formatDate(expense.dateCreated)}
                </div>
                <div className="text-secondary small mt-1">
                  Split with {formatSplitMembers(expense.splitBetweenUsers)}
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                <strong>{currency(expense.amount)}</strong>
                {canEdit(expense) ? (
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      onClick={() => onEdit(expense)}
                      title="Edit"
                      type="button"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={() => onDelete(expense)}
                      title="Delete"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                ) : null}
              </div>
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
        <Card.Footer className="d-flex flex-wrap justify-content-between align-items-center gap-3 bg-transparent">
          <div className="text-secondary small">
            Showing {visibleRangeStart}-{visibleRangeEnd} of{" "}
            {filteredExpenses.length}
          </div>
          {totalPages > 1 ? (
            <Pagination className="mb-0">
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
