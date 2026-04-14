import PropTypes from "prop-types";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import AddMemberForm from "../AddMemberForm/AddMemberForm.jsx";
import DeleteButton from "../DeleteButton/DeleteButton.jsx";
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
  return (
    <Modal show={isOpen} onHide={onClose}>
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
        {isOwner ? (
          <AddMemberForm
            isSubmitting={isSubmitting}
            onAddMember={onAddMember}
          />
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
