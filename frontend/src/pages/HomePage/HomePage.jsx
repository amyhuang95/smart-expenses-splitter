import Card from "react-bootstrap/Card";
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
          Your auth flow is connected. The next step is replacing this
          placeholder with the post-login homepage and group list.
        </p>
      </Card.Body>
    </Card>
  );
}
