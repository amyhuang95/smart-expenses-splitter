import PropTypes from "prop-types";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import "./MemberListModal.css";

export default function MemberListModal({
  groupName,
  isOpen,
  isOwner,
  isSubmitting,
  members,
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
                  <Button
                    disabled={isSubmitting}
                    onClick={() => onRemoveMember(member)}
                    size="sm"
                    type="button"
                    variant="outline-danger"
                  >
                    Remove
                  </Button>
                ) : null}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
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
  onClose: PropTypes.func.isRequired,
  onRemoveMember: PropTypes.func.isRequired,
  ownerId: PropTypes.string.isRequired,
};
