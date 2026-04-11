import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import { NavLink, Outlet } from "react-router";
import AppNavBar from "../components/AppNavBar/AppNavBar";
import { useUser } from "../context/useUser.js";
import "./AppLayout.css";

export default function AppLayout() {
  const { logout } = useUser();

  return (
    <main className="startup-page">
      <Container className="startup-page__hero">
        <AppNavBar>
          <div className="startup-page__topbar-actions">
            <Nav className="startup-page__nav">
              <NavLink to="/groups" className="startup-page__nav-link">
                Group Expenses
              </NavLink>
              <NavLink to="/single-expenses" className="startup-page__nav-link">
                Single Expenses
              </NavLink>
            </Nav>
            <button onClick={logout} type="button" className="startup-page__logout-btn">
              Log Out
            </button>
          </div>
        </AppNavBar>

        <Outlet />
      </Container>
    </main>
  );
}
