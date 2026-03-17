import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { useUser } from "../../context/UserContext.jsx";
import "./AuthForm.css";

const INITIAL_LOGIN_FORM = {
  email: "",
  password: "",
};

const INITIAL_REGISTER_FORM = {
  name: "",
  email: "",
  password: "",
};

export default function AuthForm() {
  const { login, register } = useUser();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN_FORM);
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const isLoginMode = mode === "login";

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setFeedback({ type: "", message: "" });
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setFeedback({
        type: "danger",
        message: "Enter both email and password to continue.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: "", message: "" });
      await login(loginForm);
    } catch (error) {
      setFeedback({
        type: "danger",
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();

    if (
      !registerForm.name.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password.trim()
    ) {
      setFeedback({
        type: "danger",
        message: "Complete name, email, and password to create an account.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: "", message: "" });
      await register(registerForm);
    } catch (error) {
      setFeedback({
        type: "danger",
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-form">
      <ButtonGroup className="auth-form__mode-switch" aria-label="Authentication mode switch">
        <Button
          className="auth-form__mode-button"
          onClick={() => handleModeChange("login")}
          type="button"
          variant={isLoginMode ? "dark" : "light"}
        >
          Log In
        </Button>
        <Button
          className="auth-form__mode-button"
          onClick={() => handleModeChange("register")}
          type="button"
          variant={isLoginMode ? "light" : "dark"}
        >
          Register
        </Button>
      </ButtonGroup>

      {feedback.message ? (
        <Alert className="auth-form__feedback" variant={feedback.type}>
          {feedback.message}
        </Alert>
      ) : null}

      {isLoginMode ? (
        <Form className="auth-form__panel" onSubmit={handleLoginSubmit}>
          <Form.Group className="auth-form__field" controlId="login-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              autoComplete="email"
              disabled={isSubmitting}
              name="email"
              onChange={handleLoginChange}
              placeholder="name@example.com"
              type="email"
              value={loginForm.email}
            />
          </Form.Group>

          <Form.Group className="auth-form__field" controlId="login-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              autoComplete="current-password"
              disabled={isSubmitting}
              name="password"
              onChange={handleLoginChange}
              placeholder="Enter your password"
              type="password"
              value={loginForm.password}
            />
          </Form.Group>

          <Button className="auth-form__submit" disabled={isSubmitting} type="submit" variant="dark">
            {isSubmitting ? (
              <>
                <Spinner
                  animation="border"
                  as="span"
                  className="auth-form__spinner"
                  role="status"
                  size="sm"
                />{" "}
                Logging In
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </Form>
      ) : (
        <Form className="auth-form__panel" onSubmit={handleRegisterSubmit}>
          <Form.Group className="auth-form__field" controlId="register-name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              autoComplete="name"
              disabled={isSubmitting}
              name="name"
              onChange={handleRegisterChange}
              placeholder="Your full name"
              type="text"
              value={registerForm.name}
            />
          </Form.Group>

          <Form.Group className="auth-form__field" controlId="register-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              autoComplete="email"
              disabled={isSubmitting}
              name="email"
              onChange={handleRegisterChange}
              placeholder="name@example.com"
              type="email"
              value={registerForm.email}
            />
          </Form.Group>

          <Form.Group className="auth-form__field" controlId="register-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              autoComplete="new-password"
              disabled={isSubmitting}
              name="password"
              onChange={handleRegisterChange}
              placeholder="Create a password"
              type="password"
              value={registerForm.password}
            />
          </Form.Group>

          <Button className="auth-form__submit" disabled={isSubmitting} type="submit" variant="dark">
            {isSubmitting ? (
              <>
                <Spinner
                  animation="border"
                  as="span"
                  className="auth-form__spinner"
                  role="status"
                  size="sm"
                />{" "}
                Creating Account
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </Form>
      )}
    </div>
  );
}
