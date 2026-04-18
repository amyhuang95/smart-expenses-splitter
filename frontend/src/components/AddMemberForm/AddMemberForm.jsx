import PropTypes from "prop-types";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { lookupUserByEmail } from "../../services/groups.js";

export default function AddMemberForm({ isSubmitting, onAddMember }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLooking, setIsLooking] = useState(false);

  const disabled = isSubmitting || isLooking;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter an email to add a member.");
      return;
    }

    setIsLooking(true);
    try {
      setError("");
      const found = await lookupUserByEmail(email.trim());
      await onAddMember({ name: found.name, email: found.email });
      setEmail("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsLooking(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <Form.Group controlId="add-member-email">
        <Form.Label>Add a member by email</Form.Label>
        <div className="d-flex gap-2">
          <Form.Control
            disabled={disabled}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
          <Button disabled={disabled} type="submit" variant="dark">
            {disabled ? "Adding..." : "Add"}
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
}

AddMemberForm.propTypes = {
  isSubmitting: PropTypes.bool.isRequired,
  onAddMember: PropTypes.func.isRequired,
};
