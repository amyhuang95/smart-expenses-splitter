import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import HelpTooltip from "../HelpTooltip/HelpTooltip.jsx";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Pagination from "react-bootstrap/Pagination";
import EditButton from "../EditButton/EditButton.jsx";
import { currency, formatDate } from "../../utils/format.js";

const PAGE_SIZE = 5;
const SPLIT_MEMBER_PREVIEW_LIMIT = 6;
const ALL = "all";
const CATEGORY_ORDER = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "accommodation",
  "health",
  "shopping",
  "other",
];

export default function ExpenseList({
  canAddExpense,
  currentUserId,
  expenses,
  groupOwnerId,
  groupStatus,
  onAddExpense,
  onEdit,
}) {
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailExpense, setDetailExpense] = useState(null);

  const categoryOptions = useMemo(
    () =>
      CATEGORY_ORDER.filter((cat) => expenses.some((e) => e.category === cat)),
    [expenses],
  );

  const filteredExpenses =
    categoryFilter === ALL
      ? expenses
      : expenses.filter((e) => e.category === categoryFilter);

  const totalPages = Math.max(
    Math.ceil(filteredExpenses.length / PAGE_SIZE),
    1,
  );
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
    <Card className="rounded-4" style={{ overflow: "visible" }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Card.Title className="mb-0">Expense Activity</Card.Title>
            <HelpTooltip
              position="right"
              content={
                <>
                  <strong>How expenses work:</strong>
                  <br />
                  1. Any group member can add a shared expense.
                  <br />
                  2. Use the category dropdown to filter expenses.
                  <br />
                  3. The person who paid or the group owner can edit or delete
                  an expense.
                </>
              }
            />
          </div>
          {onAddExpense ? (
            <Button
              disabled={!canAddExpense}
              onClick={onAddExpense}
              size="sm"
              type="button"
              variant="primary"
            >
              + New Expense
            </Button>
          ) : null}
        </div>
        <div className="d-flex flex-wrap gap-2 mt-3">
          <label htmlFor="expense-category" className="visually-hidden">
            Filter by category
          </label>
          <select
            id="expense-category"
            className="form-select form-select-sm w-auto"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value={ALL}>All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategoryLabel(cat)}
              </option>
            ))}
          </select>
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
                  <EditButton
                    label={`Edit ${expense.name}`}
                    onClick={() => onEdit(expense)}
                  />
                ) : (
                  <button
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    onClick={() => setDetailExpense(expense)}
                    title="View Details"
                    type="button"
                  >
                    Details
                  </button>
                )}
              </div>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>
            {categoryFilter === ALL
              ? "No expenses have been added yet."
              : "No expenses match the selected filter."}
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
      <Modal
        show={!!detailExpense}
        onHide={() => setDetailExpense(null)}
        centered
      >
        {detailExpense ? (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{detailExpense.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div className="mb-3">
                <h6>Description</h6>
                <p className="mb-0">
                  {detailExpense.description || "No description provided."}
                </p>
              </div>
            </Modal.Body>
          </>
        ) : null}
      </Modal>
    </Card>
  );
}

ExpenseList.propTypes = {
  canAddExpense: PropTypes.bool,
  currentUserId: PropTypes.string.isRequired,
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      category: PropTypes.string.isRequired,
      dateCreated: PropTypes.string.isRequired,
      description: PropTypes.string,
      name: PropTypes.string.isRequired,
      splitDetails: PropTypes.object,
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
  onAddExpense: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
};
