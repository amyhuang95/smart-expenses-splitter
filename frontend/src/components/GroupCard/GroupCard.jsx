import PropTypes from "prop-types";
import Badge from "react-bootstrap/Badge";
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

  const memberCount = group.members?.length ?? group.memberIds?.length ?? 0;
  const expenseCount = group.summary.totalExpenses;

  return (
    <Card as={Link} to={`/groups/${group._id}`} className="group-card h-100 text-decoration-none text-reset">
      <Card.Body className="d-flex flex-column gap-3">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{group.name}</Card.Title>
            <Badge bg={statusVariant} pill>
                {group.status}
            </Badge>
          </div>
          <Card.Subtitle className="group-card__subtitle text-muted fw-normal">
            {memberCount} member{memberCount !== 1 ? "s" : ""} ·{" "}
            {expenseCount > 999 ? "999+" : expenseCount} expense
            {expenseCount !== 1 ? "s" : ""}
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
        </dl>

      </Card.Body>
    </Card>
  );
}

GroupCard.propTypes = {
  group: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
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
