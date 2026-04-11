import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import AppNavBar from "../../components/AppNavBar/AppNavBar";
import AuthForm from "../../components/AuthForm/AuthForm";
import "./IndexPage.css";

export default function IndexPage() {
  return (
    <main className="startup-page">
      <Container className="startup-page__hero">
        <AppNavBar />
        <Row className="startup-page__content">
          <Col xs={12} className="text-center">
            <h1 className="startup-page__title">
              Track and settle every group expense in one place, easily.
            </h1>
          </Col>
          <Col xs={12} className="text-center">
            <p className="startup-page__description text-secondary">
              SplitEasy keeps group spendings organized, and generates smart
              settlements so you don't have to make multiple payments in a group.
            </p>
          </Col>
          <Col xs={12} className="d-flex justify-content-center">
            <Card
              className="startup-page__auth-card"
              aria-label="Authentication preview"
            >
              <Card.Body className="startup-page__auth-body">
                <p className="startup-page__auth-kicker">
                  Login or create an account
                </p>
                <AuthForm />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
