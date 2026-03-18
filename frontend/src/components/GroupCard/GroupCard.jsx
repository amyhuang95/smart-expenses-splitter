import PropTypes from "prop-types";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Link } from "react-router";
import { currency } from "../../utils/format.js";
import "./GroupCard.css";

export default function GroupCard({ group }) {
  const statusVariant =
    {
      open: "primary",
      settling: "warning",
      settled: "success",
    }[group.status] ?? "secondary";

  // The groups list endpoint returns memberIds (an array of ID strings) rather
  // than full member objects — full user data is only fetched on the detail
  // page. Fall back gracefully so the card renders in both contexts.
  const memberCount = group.members?.length ?? group.memberIds?.length ?? 0;

  return (
    <Card className="group-card h-100">
      <Card.Body className="group-card__body">
        <div className="group-card__header">
          <Badge bg={statusVariant} pill>
            {group.status}
          </Badge>
          <Card.Title className="group-card__title">{group.name}</Card.Title>
          <Card.Subtitle className="text-muted">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </Card.Subtitle>
        </div>

        <dl className="group-card__stats">
          <div>
            <dt>Total spent</dt>
            <dd>{currency(group.summary.totalSpent)}</dd>
          </div>
          <div>
            <dt>Outstanding</dt>
            <dd>{currency(group.summary.outstandingDebtAmount)}</dd>
          </div>
          <div>
            <dt>Expenses</dt>
            <dd>{group.summary.totalExpenses}</dd>
          </div>
        </dl>

        {/* Only render member tags when full user objects are available
            (i.e. on the detail page, not the summary list). */}
        {group.members?.length > 0 && (
          <div className="group-card__members">
            {group.members.map((member) => (
              <span key={member._id} className="member-tag">
                {member.name}
              </span>
            ))}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="group-card__footer">
        <Button as={Link} to={`/groups/${group._id}`} variant="dark">
          Open Group
        </Button>
      </Card.Footer>
    </Card>
  );
}

GroupCard.propTypes = {
  group: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    // Detail page provides full member objects; list page provides only IDs.
    members: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    memberIds: PropTypes.arrayOf(PropTypes.string),
    summary: PropTypes.shape({
      outstandingDebtAmount: PropTypes.number.isRequired,
      totalExpenses: PropTypes.number.isRequired,
      totalSpent: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};
