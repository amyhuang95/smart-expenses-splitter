import PropTypes from "prop-types";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import "./AddMemberForm.css";

export default function AddMemberForm({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleExited() {
    setEmail("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter an email to add a member.");
      return;
    }

    try {
      setError("");
      await onSubmit(email.trim());
      setEmail("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal show={isOpen} onExited={handleExited} onHide={onClose}>
      <Form className="add-member-form" onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add Member</Modal.Title>
        </Modal.Header>
        <Modal.Body className="add-member-form__body">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="add-member-email">
            <Form.Label>Add a member by email</Form.Label>
            <Form.Control
              autoFocus
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
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
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

AddMemberForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
