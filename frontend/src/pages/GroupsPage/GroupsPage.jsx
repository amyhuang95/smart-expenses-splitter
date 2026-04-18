import { useEffect, useMemo, useState } from "react";
import "./GroupsPage.css";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import CreateGroupForm from "../../components/CreateGroupForm/CreateGroupForm.jsx";
import GroupCard from "../../components/GroupCard/GroupCard.jsx";
import HelpTooltip from "../../components/HelpTooltip/HelpTooltip.jsx";
import { createGroup, fetchGroups } from "../../services/groups.js";

const GROUPS_PER_PAGE = 9;
const MAX_VISIBLE_PAGES = 5;
const STATUS_FILTERS = ["all", "open", "settling", "settled"];

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

    return groups.filter((group) => {
      const matchesQuery =
        !normalizedQuery || group.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || group.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [groups, query, statusFilter]);

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
  }, [query, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    <section className="d-grid gap-4">
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <h2 className="mb-0 page-title">My Groups</h2>
            <HelpTooltip
              position="right"
              content={
                <>
                  <strong>How to use Group Expenses:</strong>
                  <br />
                  1. Click &quot;+ New Group&quot; to create a new group and add
                  members to split expenses with.
                  <br />
                  2. Find the newly created group in the list and click the
                  group card to open the group details page where you can add
                  expenses and track balances.
                  <br />
                  3. Use filters to find groups that are still open, being
                  settled, or fully settled.
                </>
              }
            />
          </div>
          <Button
            className="flex-shrink-0 fw-semibold"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            + New Group
          </Button>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Form.Control
            aria-label="Search groups"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups by name"
            style={{ maxWidth: "20rem", width: "20rem" }}
            type="search"
            value={query}
          />
          <div className="d-flex align-items-center gap-2 ms-auto">
            <div
              aria-label="Filter groups by status"
              className="d-flex flex-wrap gap-2"
              role="group"
            >
              {STATUS_FILTERS.map((status) => (
                <button
                  aria-pressed={statusFilter === status}
                  className={`btn btn-sm rounded-pill ${statusFilter === status ? "btn-dark" : "btn-light"}`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <HelpTooltip
              position="bottom"
              content={
                <>
                  <strong>Group statuses:</strong>
                  <br />
                  <strong>Open</strong> — Members can add, edit, and delete
                  expenses.
                  <br />
                  <strong>Settling</strong> — The owner has initiated
                  settlement. Members can mark debts as paid, but expenses are
                  locked.
                  <br />
                  <strong>Settled</strong> — All debts have been paid and the
                  group is fully resolved.
                </>
              }
            />
          </div>
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {isLoading ? (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ minHeight: "16rem" }}
        >
          <Spinner animation="border" role="status" variant="dark" />
        </div>
      ) : filteredGroups.length ? (
        <>
          <Row className="g-4">
            {currentPage === 1 && !query.trim() && statusFilter === "all" ? (
              <Col lg={6} xl={4}>
                <button
                  className="groups-page__add-card"
                  onClick={() => setIsCreateOpen(true)}
                  type="button"
                >
                  <span className="groups-page__add-card-icon">+</span>
                  <span>New Group</span>
                </button>
              </Col>
            ) : null}
            {paginatedGroups.map((group) => (
              <Col key={group._id} lg={6} xl={4}>
                <GroupCard group={group} />
              </Col>
            ))}
          </Row>

          <p className="text-secondary mb-0">{resultsLabel}</p>

          {totalPages > 1 ? (
            <Pagination className="justify-content-end mb-0">
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
              {visiblePageNumbers[visiblePageNumbers.length - 1] <
              totalPages ? (
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
        <div
          className="d-grid align-items-center justify-items-center text-center p-5 rounded-4"
          style={{
            minHeight: "16rem",
            border: "1px dashed rgba(33,37,41,0.15)",
          }}
        >
          <div>
            <h2>
              {query.trim() || statusFilter !== "all"
                ? "No matching groups"
                : "No groups yet"}
            </h2>
            <p className="text-secondary mb-0">
              {query.trim() || statusFilter !== "all"
                ? "Try a different search term or filter."
                : "Create your first group to start splitting expenses."}
            </p>
          </div>
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
