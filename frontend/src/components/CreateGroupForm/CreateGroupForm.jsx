import PropTypes from "prop-types";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useUser } from "../../context/useUser.js";
import "./CreateGroupForm.css";

const INITIAL_FORM = {
  name: "",
  members: "",
};

// Basic email format check — must contain at least one character
// before @, a domain segment, a dot, and a TLD segment.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateGroupForm({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const { user } = useUser();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleExited() {
    setForm(INITIAL_FORM);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Enter a group name.");
      return;
    }

    const memberEmails = form.members
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    // Validate each parsed email before sending to the API.
    const invalidEmails = memberEmails.filter((email) => !EMAIL_RE.test(email));
    if (invalidEmails.length > 0) {
      setError(
        `These don't look like valid email addresses: ${invalidEmails.join(", ")}`,
      );
      return;
    }

    // A group needs at least one other person. Strip out the current user's
    // own email (the backend adds them automatically as owner) and check
    // whether any other members remain.
    const otherEmails = memberEmails.filter(
      (email) => email.toLowerCase() !== user.email.toLowerCase(),
    );
    if (otherEmails.length === 0) {
      setError("Add at least one other member to create a group.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: form.name.trim(),
        memberEmails,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal show={isOpen} onExited={handleExited} onHide={onClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create a Group</Modal.Title>
        </Modal.Header>
        <Modal.Body className="create-group-form">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="group-name">
            <Form.Label>Group name</Form.Label>
            <Form.Control
              disabled={isSubmitting}
              name="name"
              onChange={handleChange}
              placeholder="Miami Trip 2026"
              type="text"
              value={form.name}
            />
          </Form.Group>
          <Form.Group controlId="group-members">
            <Form.Label>Member emails</Form.Label>
            <Form.Control
              as="textarea"
              className="create-group-form__textarea"
              disabled={isSubmitting}
              name="members"
              onChange={handleChange}
              placeholder="friend1@example.com, friend2@example.com"
              rows={4}
              value={form.members}
            />
            <Form.Text muted>
              Separate emails with commas. The creator is added automatically.
            </Form.Text>
          </Form.Group>
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
            {isSubmitting ? "Creating..." : "Create Group"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

CreateGroupForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
