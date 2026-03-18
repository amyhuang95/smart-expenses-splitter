import PropTypes from "prop-types";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import "./MemberListModal.css";

export default function MemberListModal({
  groupName,
  isOpen,
  isOwner,
  isSubmitting,
  members,
  onAddMember,
  onClose,
  onRemoveMember,
  ownerId,
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleExited() {
    setEmail("");
    setError("");
  }

  async function handleAddMember(event) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter an email to add a member.");
      return;
    }
    try {
      setError("");
      await onAddMember(email.trim());
      setEmail("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <Modal show={isOpen} onExited={handleExited} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{groupName} Members</Modal.Title>
      </Modal.Header>
      <Modal.Body className="member-list-modal__body">
        <ListGroup variant="flush">
          {members.map((member) => {
            const isGroupOwner = member._id === ownerId;

            return (
              <ListGroup.Item
                key={member._id}
                className="member-list-modal__item"
              >
                <div>
                  <div className="member-list-modal__name">{member.name}</div>
                  <div className="member-list-modal__meta">
                    {isGroupOwner ? "Owner" : "Member"}
                  </div>
                </div>
                {isOwner && !isGroupOwner ? (
                  <Button
                    disabled={isSubmitting}
                    onClick={() => onRemoveMember(member)}
                    size="sm"
                    type="button"
                    variant="outline-danger"
                  >
                    ❌
                  </Button>
                ) : null}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
        {isOwner ? (
          <Form className="mt-3" onSubmit={handleAddMember}>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Form.Group controlId="member-list-add-email">
              <Form.Label>Add a member by email</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  disabled={isSubmitting}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                />
                <Button disabled={isSubmitting} type="submit" variant="dark">
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </div>
            </Form.Group>
          </Form>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}

MemberListModal.propTypes = {
  groupName: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onAddMember: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onRemoveMember: PropTypes.func.isRequired,
  ownerId: PropTypes.string.isRequired,
};
