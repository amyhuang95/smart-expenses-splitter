import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import DeleteButton from "../DeleteButton/DeleteButton.jsx";
import "./AddExpenseForm.css";

const CATEGORIES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "food", label: "Food" },
  { value: "health", label: "Health" },
  { value: "shopping", label: "Shopping" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

const INITIAL_FORM = {
  name: "",
  description: "",
  amount: "",
  category: "other",
  splitBetween: null,
};

function hasAtMostTwoDecimals(value) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim());
}

function buildFormFromValues(initialValues) {
  if (!initialValues) return INITIAL_FORM;
  return {
    name: initialValues.name ?? "",
    description: initialValues.description ?? "",
    amount:
      initialValues.amount === undefined || initialValues.amount === null
        ? ""
        : String(initialValues.amount),
    category: initialValues.category ?? "other",
    splitBetween: initialValues.splitBetween ?? null,
  };
}

export default function AddExpenseForm({
  isOpen,
  isSubmitting,
  initialValues,
  members,
  onClose,
  onDelete,
  onSubmit,
  submitLabel = "Save Expense",
  title = "Add Shared Expense",
}) {
  // The parent passes a `key` prop tied to the expense ID (or "new-expense"),
  // so this component fully remounts whenever initialValues switches — making
  // the lazy initializer here the single source of truth. No useEffect sync
  // is needed, and adding one would trigger the cascading-renders lint error.
  const [form, setForm] = useState(() => buildFormFromValues(initialValues));
  const [error, setError] = useState("");
  const [memberQuery, setMemberQuery] = useState("");

  const memberIds = useMemo(
    () => members.map((member) => member._id),
    [members],
  );
  const selectedMemberIds = form.splitBetween ?? memberIds;
  const filteredMembers = useMemo(() => {
    const normalizedQuery = memberQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) =>
      member.name.toLowerCase().includes(normalizedQuery),
    );
  }, [memberQuery, members]);
  const hasMemberQuery = memberQuery.trim().length > 0;
  const visibleMemberIds = filteredMembers.map((member) => member._id);

  function handleExited() {
    setForm(INITIAL_FORM);
    setError("");
    setMemberQuery("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleMemberToggle(memberId) {
    const nextSelectedMemberIds = selectedMemberIds.includes(memberId)
      ? selectedMemberIds.filter((entry) => entry !== memberId)
      : [...selectedMemberIds, memberId];

    setForm((currentForm) => ({
      ...currentForm,
      splitBetween: nextSelectedMemberIds,
    }));
  }

  function handleSelectMembers(nextMemberIds) {
    setForm((currentForm) => ({
      ...currentForm,
      splitBetween: nextMemberIds,
    }));
  }

  function handleSelectVisible() {
    handleSelectMembers(
      Array.from(new Set([...selectedMemberIds, ...visibleMemberIds])),
    );
  }

  function handleClearVisible() {
    handleSelectMembers(
      selectedMemberIds.filter((memberId) => !visibleMemberIds.includes(memberId)),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.amount) {
      setError("Enter an expense name and amount.");
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!hasAtMostTwoDecimals(form.amount)) {
      setError("Enter an amount with at most 2 decimal places.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        amount: Number(amount.toFixed(2)),
        category: form.category,
        splitBetween: selectedMemberIds,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal onExited={handleExited} onHide={onClose} show={isOpen} size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="add-expense-form">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <div className="add-expense-form__layout">
            <div className="add-expense-form__main">
              <Form.Group controlId="expense-name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  name="name"
                  onChange={handleChange}
                  placeholder="Groceries"
                  type="text"
                  value={form.name}
                />
              </Form.Group>
              <Form.Group controlId="expense-description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  disabled={isSubmitting}
                  name="description"
                  onChange={handleChange}
                  placeholder="Trader Joe's run for the apartment"
                  rows={3}
                  value={form.description}
                />
              </Form.Group>
              <div className="add-expense-form__split">
                <Form.Group controlId="expense-amount">
                  <Form.Label>Amount ($)</Form.Label>
                  <Form.Control
                    disabled={isSubmitting}
                    min="0.01"
                    name="amount"
                    onChange={handleChange}
                    step="0.01"
                    type="number"
                    value={form.amount}
                  />
                </Form.Group>
                <Form.Group controlId="expense-category">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    disabled={isSubmitting}
                    name="category"
                    onChange={handleChange}
                    value={form.category}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="add-expense-form__sidebar">
              <fieldset className="add-expense-form__fieldset">
                <Form.Label className="add-expense-form__fieldset-label">
                  Split between
                </Form.Label>
                <div className="add-expense-form__members-tools">
                  <Form.Control
                    disabled={isSubmitting}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Search members"
                    type="search"
                    value={memberQuery}
                  />
                  <div className="add-expense-form__members-summary">
                    {selectedMemberIds.length} of {memberIds.length} selected
                  </div>
                  <div className="add-expense-form__member-actions">
                    {!hasMemberQuery ? (
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleSelectMembers(memberIds)}
                        size="sm"
                        type="button"
                        variant="outline-primary"
                      >
                        Select all
                      </Button>
                    ) : null}
                    {!hasMemberQuery ? (
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleSelectMembers([])}
                        size="sm"
                        type="button"
                        variant="link"
                        className="add-expense-form__clear-btn"
                      >
                        Clear all
                      </Button>
                    ) : null}
                    {hasMemberQuery ? (
                      <Button
                        disabled={isSubmitting || !visibleMemberIds.length}
                        onClick={handleSelectVisible}
                        size="sm"
                        type="button"
                        variant="outline-primary"
                      >
                        Select visible
                      </Button>
                    ) : null}
                    {hasMemberQuery ? (
                      <Button
                        disabled={isSubmitting || !visibleMemberIds.length}
                        onClick={handleClearVisible}
                        size="sm"
                        type="button"
                        variant="link"
                        className="add-expense-form__clear-btn"
                      >
                        Clear visible
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="add-expense-form__members">
                  {filteredMembers.length ? (
                    filteredMembers.map((member) => (
                      <Form.Check
                        key={member._id}
                        checked={selectedMemberIds.includes(member._id)}
                        className="add-expense-form__check"
                        disabled={isSubmitting}
                        id={`expense-member-${member._id}`}
                        label={member.name}
                        onChange={() => handleMemberToggle(member._id)}
                        type="checkbox"
                      />
                    ))
                  ) : (
                    <p className="add-expense-form__empty">
                      No members match that search.
                    </p>
                  )}
                </div>
              </fieldset>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex">
          {onDelete ? (
            <DeleteButton
              label="Delete this expense"
              onClick={onDelete}
            />
          ) : null}
          <div className="ms-auto d-flex gap-2">
            <Button
              className="add-expense-form__cancel-btn"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline-secondary"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="dark">
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

AddExpenseForm.propTypes = {
  initialValues: PropTypes.shape({
    amount: PropTypes.number,
    category: PropTypes.string,
    description: PropTypes.string,
    name: PropTypes.string,
    splitBetween: PropTypes.arrayOf(PropTypes.string),
  }),
  isOpen: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  title: PropTypes.string,
};
