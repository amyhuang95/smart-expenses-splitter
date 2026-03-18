import { useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import CreateGroupForm from "../../components/CreateGroupForm/CreateGroupForm.jsx";
import GroupCard from "../../components/GroupCard/GroupCard.jsx";
import { createGroup, fetchGroups } from "../../services/groups.js";
import "./GroupsPage.css";

const GROUPS_PER_PAGE = 9;
const MAX_VISIBLE_PAGES = 5;

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroups.length / GROUPS_PER_PAGE),
  );

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * GROUPS_PER_PAGE;
    return filteredGroups.slice(startIndex, startIndex + GROUPS_PER_PAGE);
  }, [currentPage, filteredGroups]);

  const resultsLabel = useMemo(() => {
    if (!filteredGroups.length) {
      return "Showing 0 groups";
    }

    const startCount = (currentPage - 1) * GROUPS_PER_PAGE + 1;
    const endCount = Math.min(
      currentPage * GROUPS_PER_PAGE,
      filteredGroups.length,
    );

    return `Showing ${startCount}-${endCount} of ${filteredGroups.length} groups`;
  }, [currentPage, filteredGroups]);

  const visiblePageNumbers = useMemo(() => {
    const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
    const startPage = Math.max(1, currentPage - halfWindow);
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
    const adjustedStartPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);

    return Array.from(
      { length: endPage - adjustedStartPage + 1 },
      (_, index) => adjustedStartPage + index,
    );
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      setCurrentPage(1);
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="groups-page">
      <div className="groups-page__toolbar">
        <Form.Control
          aria-label="Search groups"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search groups by name"
          type="search"
          value={query}
        />
        <Button
          onClick={() => setIsCreateOpen(true)}
          type="button"
          variant="dark"
        >
          Create Group
        </Button>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {isLoading ? (
        <div className="groups-page__empty">
          <Spinner animation="border" role="status" variant="dark" />
        </div>
      ) : filteredGroups.length ? (
        <>
          <div className="groups-page__results">
            <p className="groups-page__results-label">{resultsLabel}</p>
          </div>

          <Row className="g-4">
            {paginatedGroups.map((group) => (
              <Col key={group._id} lg={6} xl={4}>
                <GroupCard group={group} />
              </Col>
            ))}
          </Row>

          {totalPages > 1 ? (
            <Pagination className="groups-page__pagination">
              <Pagination.First
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              />
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              />
              {visiblePageNumbers[0] > 1 ? (
                <Pagination.Ellipsis disabled />
              ) : null}
              {visiblePageNumbers.map((pageNumber) => (
                <Pagination.Item
                  active={pageNumber === currentPage}
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Item>
              ))}
              {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages ? (
                <Pagination.Ellipsis disabled />
              ) : null}
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              />
              <Pagination.Last
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              />
            </Pagination>
          ) : null}
        </>
      ) : (
        <div className="groups-page__empty">
          <h2>{query.trim() ? "No matching groups" : "No groups yet"}</h2>
          <p>
            {query.trim()
              ? "Try a different search term or create a new group."
              : "Create your first group to start splitting expenses."}
          </p>
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
