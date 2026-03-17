import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavLink from "react-bootstrap/NavLink";
import { useUser } from "../context/useUser.js";

export default function BaseTemplate() {
  const { logout, user } = useUser();

  return (
    <main className="startup-page">
      <Container className="startup-page__hero">
        <Navbar className="startup-page__topbar">
          <Navbar.Brand href="/" className="startup-page__brand">
            <span className="startup-page__brand-mark" aria-hidden="true">
              $
            </span>
            <span>
              <span className="startup-page__brand-name">SplitEasy</span>
              <span className="startup-page__brand-tagline">
                Split group expenses easily
              </span>
            </span>
          </Navbar.Brand>
          <div className="startup-page__topbar-actions">
            <Nav className="startup-page__nav">
              <NavLink href="/groups" className="startup-page__nav-link">
                Group Expenses
              </NavLink>
              <NavLink
                href="/single-expenses"
                className="startup-page__nav-link"
              >
                Single Expenses
              </NavLink>
            </Nav>
            <Button onClick={logout} type="button" variant="outline-dark">
              Log Out
            </Button>
          </div>
        </Navbar>

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
      </Container>
    </main>
  );
}
