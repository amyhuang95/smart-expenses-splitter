import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import AuthForm from "../../components/AuthForm/AuthForm";
import "./IndexPage.css";

export default function IndexPage() {
  return (
    <main className="startup-page">
      <Container className="startup-page__hero">
        <Navbar expand="md" className="startup-page__topbar">
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
        </Navbar>

        <Row className="startup-page__content">
          <h1 className="startup-page__title">
            Track and settle every group expense in one place, easily.
          </h1>
          <p className="startup-page__description">
            SplitEasy keeps group spendings organized, and generates smart
            settlements so you don't have to make multiple payments in a group.
          </p>

          <Card
            className="startup-page__auth-card"
            aria-label="Authentication preview"
          >
            <Card.Body className="startup-page__auth-body">
              <p className="startup-page__auth-kicker">Login or create an account to manage your group expenses</p>
              <AuthForm />
            </Card.Body>
          </Card>
        </Row>
      </Container>
    </main>
  );
}
