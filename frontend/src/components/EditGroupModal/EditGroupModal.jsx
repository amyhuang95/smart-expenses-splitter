import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import AddMemberForm from "../AddMemberForm/AddMemberForm.jsx";
import DeleteButton from "../DeleteButton/DeleteButton.jsx";
import "./EditGroupModal.css";

export default function EditGroupModal({
  groupName,
  isOpen,
  isSubmitting,
  memberError,
  members,
  onAddMember,
  onClearMemberError,
  onClose,
  onRemoveMember,
  onRenameGroup,
  ownerId,
}) {
  const [name, setName] = useState(groupName);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(groupName);
      setNameError("");
      setNameSuccess("");
    }
    // Only reset when the modal opens — not when groupName changes after a
    // successful save, which would wipe the success alert immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!nameSuccess) return undefined;
    const timeout = setTimeout(() => setNameSuccess(""), 2500);
    return () => clearTimeout(timeout);
  }, [nameSuccess]);

  const trimmedName = name.trim();
  const nameChanged = trimmedName && trimmedName !== groupName;

  async function handleSaveName(event) {
    event.preventDefault();
    if (!trimmedName) {
      setNameError("Group name is required.");
      return;
    }
    if (!nameChanged) {
      return;
    }
    setIsSavingName(true);
    try {
      setNameError("");
      setNameSuccess("");
      await onRenameGroup(trimmedName);
      setNameSuccess("Group name updated.");
    } catch (submitError) {
      setNameError(submitError.message);
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <Modal show={isOpen} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Group</Modal.Title>
      </Modal.Header>
      <Modal.Body className="edit-group-modal__body">
        <Form onSubmit={handleSaveName}>
          {nameError ? <Alert variant="danger">{nameError}</Alert> : null}
          {nameSuccess ? <Alert variant="success">{nameSuccess}</Alert> : null}
          <Form.Group controlId="edit-group-name">
            <Form.Label>Group name</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                disabled={isSavingName}
                onChange={(e) => setName(e.target.value)}
                type="text"
                value={name}
              />
              <Button
                disabled={isSavingName || !nameChanged}
                type="submit"
                variant="dark"
              >
                {isSavingName ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form.Group>
        </Form>

        <div>
          <div className="edit-group-modal__section-label">Members</div>
          {memberError ? (
            <Alert variant="danger" dismissible onClose={onClearMemberError}>
              {memberError}
            </Alert>
          ) : null}
          <ListGroup variant="flush">
            {members.map((member) => {
              const isGroupOwner = member._id === ownerId;
              return (
                <ListGroup.Item
                  key={member._id}
                  className="edit-group-modal__item"
                >
                  <div>
                    <div className="edit-group-modal__name">{member.name}</div>
                    <div className="edit-group-modal__meta">
                      {isGroupOwner ? "Owner" : "Member"}
                    </div>
                  </div>
                  {!isGroupOwner ? (
                    <DeleteButton
                      compact
                      label={`Remove ${member.name}`}
                      onClick={() => onRemoveMember(member)}
                    />
                  ) : null}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>

        <AddMemberForm isSubmitting={isSubmitting} onAddMember={onAddMember} />
      </Modal.Body>
    </Modal>
  );
}

EditGroupModal.propTypes = {
  groupName: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  memberError: PropTypes.string,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onAddMember: PropTypes.func.isRequired,
  onClearMemberError: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onRemoveMember: PropTypes.func.isRequired,
  onRenameGroup: PropTypes.func.isRequired,
  ownerId: PropTypes.string.isRequired,
};
