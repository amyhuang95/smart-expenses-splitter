import Navbar from "react-bootstrap/Navbar";

export default function AppNavBar({ children }) {
  return (
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
      {children}
    </Navbar>
  );
}
