import { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useUser } from "../context/useUser.js";
import MyExpenses from "./MyExpenses/MyExpenses.jsx";

export default function BaseTemplate() {
  const { logout, user } = useUser();
  const [activePage, setActivePage] = useState("groups");

  return (
    <main>
      {/* Top Navigation */}
      <Navbar bg="dark" variant="dark" className="px-3">
        <Navbar.Brand
          style={{ cursor: "pointer" }}
          onClick={() => setActivePage("groups")}
        >
          <span
            className="badge bg-primary me-2 fs-6"
            aria-hidden="true"
          >
            $
          </span>
          SplitEasy
        </Navbar.Brand>

        <Nav className="me-auto">
          <Nav.Link
            active={activePage === "groups"}
            onClick={() => setActivePage("groups")}
          >
            Group Expenses
          </Nav.Link>
          <Nav.Link
            active={activePage === "myexpenses"}
            onClick={() => setActivePage("myexpenses")}
          >
            Single Expenses
          </Nav.Link>
        </Nav>

        <div className="d-flex align-items-center gap-2">
          <span className="text-light small">
            {user?.name || "User"}
          </span>
          <Button onClick={logout} type="button" variant="outline-light" size="sm">
            Log Out
          </Button>
        </div>
      </Navbar>

      {/* Page Content */}
      <Container fluid className="px-4 py-4">
        {activePage === "myexpenses" ? (
          <MyExpenses user={user} />
        ) : (
          /* Amy's Groups page goes here — replace this placeholder */
          <div className="text-center py-5">
            <h2>Group Expenses</h2>
            <p className="text-secondary">
              Amy&apos;s group expenses page will go here.
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}