import PropTypes from "prop-types";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import AddMemberForm from "../AddMemberForm/AddMemberForm.jsx";
import DeleteButton from "../DeleteButton/DeleteButton.jsx";
import { useUser } from "../../context/useUser.js";
import "./CreateGroupForm.css";

export default function CreateGroupForm({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const { user } = useUser();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  function handleExited() {
    setGroupName("");
    setMembers([]);
    setError("");
  }

  async function handleAddMember({ name, email }) {
    if (email.toLowerCase() === user.email.toLowerCase()) {
      throw new Error("You'll be added automatically as the group owner.");
    }
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("This email has already been added.");
    }
    setMembers((prev) => [...prev, { email, name }]);
  }

  function handleRemoveMember(emailToRemove) {
    setMembers((prev) => prev.filter((m) => m.email !== emailToRemove));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!groupName.trim()) {
      setError("Enter a group name.");
      return;
    }
    if (members.length === 0) {
      setError("Add at least one other member to create a group.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: groupName.trim(),
        memberEmails: members.map((m) => m.email),
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal show={isOpen} onExited={handleExited} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create a Group</Modal.Title>
      </Modal.Header>
      <Modal.Body className="create-group-form">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Form.Group controlId="group-name">
          <Form.Label>Group name</Form.Label>
          <Form.Control
            disabled={isSubmitting}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Miami Trip 2026"
            type="text"
            value={groupName}
          />
        </Form.Group>

        {members.length > 0 ? (
          <ListGroup variant="flush">
            {members.map((member) => (
              <ListGroup.Item
                key={member.email}
                className="create-group-form__member-item"
              >
                <div>
                  <div className="create-group-form__member-name">
                    {member.name}
                  </div>
                  <div className="create-group-form__member-email">
                    {member.email}
                  </div>
                </div>
                <DeleteButton
                  compact
                  label={`Remove ${member.name}`}
                  onClick={() => handleRemoveMember(member.email)}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : null}

        <AddMemberForm
          isSubmitting={isSubmitting}
          onAddMember={handleAddMember}
        />
        <Form.Text muted>
          The creator is added automatically.
        </Form.Text>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
          variant="outline-danger"
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={handleSubmit}
          type="button"
          variant="dark"
        >
          {isSubmitting ? "Creating..." : "Create Group"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

CreateGroupForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
