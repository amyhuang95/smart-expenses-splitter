import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Link } from "react-router";
import { useUser } from "../../context/useUser.js";

export default function HomePage() {
  const { user } = useUser();

  return (
    <Card className="startup-page__auth-card">
      <Card.Body className="startup-page__auth-body">
        <p className="startup-page__auth-kicker">Signed In</p>
        <h1 className="startup-page__auth-title">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="startup-page__auth-copy">
          Your group workspace is ready. Open the dashboard to create a group,
          log shared expenses, and settle balances.
        </p>
        <Button as={Link} to="/groups" type="button" variant="dark">
          Open Group Dashboard
        </Button>
      </Card.Body>
    </Card>
  );
}
