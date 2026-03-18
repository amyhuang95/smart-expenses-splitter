import { useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import CreateGroupForm from "../../components/CreateGroupForm/CreateGroupForm.jsx";
import GroupCard from "../../components/GroupCard/GroupCard.jsx";
import { createGroup, fetchGroups } from "../../services/groups.js";
import "./GroupsPage.css";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      try {
        const nextGroups = await fetchGroups();
        if (isMounted) {
          setGroups(nextGroups);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return groups;
    }

    return groups.filter((group) =>
      group.name.toLowerCase().includes(normalizedQuery),
    );
  }, [groups, query]);

  // Errors are intentionally not caught here — they propagate up to
  // CreateGroupForm's own catch block so they display inside the modal
  // rather than on the page behind it.
  async function handleCreateGroup(payload) {
    try {
      setIsSubmitting(true);
      const response = await createGroup(payload);
      setGroups((currentGroups) => [
        {
          ...response.group,
          summary: response.summary,
        },
        ...currentGroups,
      ]);
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="groups-page">
      <header className="groups-page__header">
        <div>
          <p className="groups-page__eyebrow">Group Expenses</p>
          <h1 className="groups-page__title">
            Manage every shared tab in one place.
          </h1>
          <p className="groups-page__copy">
            Create groups, add members, record expenses, and follow settlement
            progress without leaving the dashboard.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          type="button"
          variant="dark"
        >
          Create Group
        </Button>
      </header>

      <div className="groups-page__toolbar">
        <Form.Control
          aria-label="Search groups"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search groups by name"
          type="search"
          value={query}
        />
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {isLoading ? (
        <div className="groups-page__empty">
          <Spinner animation="border" role="status" variant="dark" />
        </div>
      ) : filteredGroups.length ? (
        <Row className="g-4">
          {filteredGroups.map((group) => (
            <Col key={group._id} lg={6} xl={4}>
              <GroupCard group={group} />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="groups-page__empty">
          <h2>No groups yet</h2>
          <p>Create your first group to start splitting expenses.</p>
        </div>
      )}

      <CreateGroupForm
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </section>
  );
}
