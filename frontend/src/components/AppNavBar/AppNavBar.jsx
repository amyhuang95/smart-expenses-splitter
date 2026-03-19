import PropTypes from "prop-types";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router";
import "./AppNavBar.css";

export default function AppNavBar({ children }) {
  return (
    <Navbar expand="md" className="startup-page__topbar">
      <Navbar.Brand as={Link} to="/" className="startup-page__brand">
        <span className="startup-page__brand-mark bg-dark text-white" aria-hidden="true">
          $
        </span>
        <span>
          <span className="startup-page__brand-name">SplitEasy</span>
          <span className="startup-page__brand-tagline text-secondary">
            Split group expenses easily
          </span>
        </span>
      </Navbar.Brand>
      {children}
    </Navbar>
  );
}

AppNavBar.propTypes = {
  children: PropTypes.node,
};
