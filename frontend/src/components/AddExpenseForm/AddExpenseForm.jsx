import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import "./AddExpenseForm.css";

const CATEGORIES = [
  { value: "food", label: "Food" },
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
  splitBetween: [],
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
    splitBetween: initialValues.splitBetween ?? [],
  };
}

export default function AddExpenseForm({
  isOpen,
  isSubmitting,
  initialValues,
  members,
  onClose,
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

  const memberIds = useMemo(
    () => members.map((member) => member._id),
    [members],
  );

  function handleExited() {
    setForm(INITIAL_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleMemberToggle(memberId) {
    setForm((currentForm) => ({
      ...currentForm,
      splitBetween: currentForm.splitBetween.includes(memberId)
        ? currentForm.splitBetween.filter((entry) => entry !== memberId)
        : [...currentForm.splitBetween, memberId],
    }));
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
        splitBetween: form.splitBetween.length ? form.splitBetween : memberIds,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal show={isOpen} onExited={handleExited} onHide={onClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="add-expense-form">
          {error ? <Alert variant="danger">{error}</Alert> : null}
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
              <Form.Label>Amount</Form.Label>
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
          <fieldset>
            <Form.Label as="legend">Split between</Form.Label>
            <div className="add-expense-form__members">
              {members.map((member) => (
                <Form.Check
                  key={member._id}
                  checked={
                    form.splitBetween.length
                      ? form.splitBetween.includes(member._id)
                      : true
                  }
                  className="add-expense-form__check"
                  disabled={isSubmitting}
                  id={`expense-member-${member._id}`}
                  label={member.name}
                  onChange={() => handleMemberToggle(member._id)}
                  type="checkbox"
                />
              ))}
            </div>
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <Button
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
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  title: PropTypes.string,
};
