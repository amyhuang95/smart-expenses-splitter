import PropTypes from "prop-types";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router";
import "./AppNavBar.css";

export default function AppNavBar({ children }) {
  return (
    <Navbar expand="md" className="app-navbar__topbar">
      <Navbar.Brand as={Link} to="/" className="app-navbar__brand">
        <span className="app-navbar__brand-mark" aria-hidden="true">
          $
        </span>
        <span>
          <span className="app-navbar__brand-name">SplitEasy</span>
          <span className="app-navbar__brand-tagline text-secondary">
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
