import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate, useParams } from "react-router";
import AddExpenseForm from "../../components/AddExpenseForm/AddExpenseForm.jsx";
import BalanceSummary from "../../components/BalanceSummary/BalanceSummary.jsx";
import ExpenseList from "../../components/ExpenseList/ExpenseList.jsx";
import MemberListModal from "../../components/MemberListModal/MemberListModal.jsx";
import { useUser } from "../../context/useUser.js";
import {
  addGroupMember,
  createGroupExpense,
  deleteGroup,
  deleteGroupExpense,
  fetchGroupDetails,
  markDebtAsPaid,
  removeGroupMember,
  settleGroup,
  updateGroupExpense,
} from "../../services/groups.js";
import { currency } from "../../utils/format.js";
import "./GroupDetailsPage.css";

const ACTION = {
  EXPENSE: "expense",
  MEMBER: "member",
  SETTLE: "settle",
  MARK_PAID: "markPaid",
  DELETE: "delete",
};

const MEMBER_PREVIEW_LIMIT = 6;

function ConfirmModal({ title, message, confirmLabel = "Confirm", confirmVariant = "danger", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div
        className="bg-white rounded-3 p-4 shadow text-center"
        style={{ maxWidth: 400, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-2">{title}</h5>
        <p className="text-secondary small mb-4">{message}</p>
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={`btn btn-${confirmVariant}`} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [groupData, setGroupData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [workingActions, setWorkingActions] = useState(new Set());
  const [editingExpense, setEditingExpense] = useState(null);

  // Confirm modal state — holds the action config when a confirmation is pending
  const [confirm, setConfirm] = useState(null);

  const isWorking = (key) => workingActions.has(key);
  const isAnyWorking = workingActions.size > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadGroup() {
      try {
        const nextGroup = await fetchGroupDetails(groupId);
        if (isMounted) {
          setGroupData(nextGroup);
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

    loadGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  async function runAction(actionKey, action) {
    try {
      setWorkingActions((prev) => new Set(prev).add(actionKey));
      setError("");
      const nextData = await action();
      setGroupData(nextData);
      return nextData;
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setWorkingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  }

  async function handleRemoveMember(member) {
    setConfirm({
      title: "Remove Member",
      message: `Remove ${member.name} from "${groupData.group.name}"?`,
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        await runAction(ACTION.MEMBER, () =>
          removeGroupMember(groupData.group._id, member._id),
        );
      },
    });
  }

  async function handleSettleUp() {
    setConfirm({
      title: "Settle Up",
      message: `Settle up "${groupData.group.name}"? This will lock the group and prevent further edits.`,
      confirmLabel: "Settle Up",
      confirmVariant: "dark",
      onConfirm: async () => {
        setConfirm(null);
        await runAction(ACTION.SETTLE, () => settleGroup(groupData.group._id));
      },
    });
  }

  async function handleDeleteGroup() {
    setConfirm({
      title: "Delete Group",
      message: `Delete "${groupData.group.name}"? This will permanently remove the group and all of its shared expenses.`,
      confirmLabel: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        try {
          setWorkingActions((prev) => new Set(prev).add(ACTION.DELETE));
          setError("");
          await deleteGroup(groupData.group._id);
          navigate("/groups");
        } catch (actionError) {
          setError(actionError.message);
        } finally {
          setWorkingActions((prev) => {
            const next = new Set(prev);
            next.delete(ACTION.DELETE);
            return next;
          });
        }
      },
    });
  }

  async function handleDeleteExpense(expense) {
    setConfirm({
      title: "Delete Expense",
      message: `Delete "${expense.name}" (${currency(expense.amount)}) from "${groupData.group.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirm(null);
        await runAction(ACTION.EXPENSE, () =>
          deleteGroupExpense(groupData.group._id, expense._id),
        );
        if (editingExpense?._id === expense._id) {
          setEditingExpense(null);
          setIsExpenseOpen(false);
        }
      },
    });
  }

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "40vh" }}>
        <Spinner animation="border" role="status" variant="dark" />
      </div>
    );
  }

  if (!groupData) {
    return (
      <div>
        <Alert variant="danger">
          {error || "That group could not be found."}
        </Alert>
        <Button as={Link} to="/groups" type="button" variant="link">
          Back to groups
        </Button>
      </div>
    );
  }

  const { debts, expenses, group, summary } = groupData;
  const isOwner = group.currentUserRole === "owner";
  const expenseFormTitle = editingExpense ? "Edit Shared Expense" : "Add Shared Expense";
  const expenseSubmitLabel = editingExpense ? "Save Changes" : "Save Expense";
  const members = group.members ?? [];
  const previewMembers = members.slice(0, MEMBER_PREVIEW_LIMIT);
  const hiddenMemberCount = Math.max(members.length - MEMBER_PREVIEW_LIMIT, 0);

  const statusVariant =
    {
      settled: "success",
      settling: "warning",
      open: "primary",
    }[group.status] ?? "secondary";

  return (
    <section className="d-grid gap-4">
      <Link to="/groups" className="group-details-page__back-link">
        ← Back to Groups
      </Link>

      <Card className="rounded-4 overflow-hidden">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <Badge bg={statusVariant} pill>
                  {group.status}
              </Badge>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <h1 className="mb-0">{group.name}</h1>
              </div>
            </div>
            {isOwner ? (
              <div className="d-flex flex-wrap justify-content-end align-items-center gap-2">
                <Button
                  disabled={isWorking(ACTION.DELETE)}
                  onClick={handleDeleteGroup}
                  size="sm"
                  type="button"
                  variant="outline-danger"
                >
                  {isWorking(ACTION.DELETE) ? "Deleting..." : "Delete Group"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="d-grid gap-2 mt-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {previewMembers.map((member) => (
                <span key={member._id} className="member-tag">
                  {member.name}
                  {member._id === group.ownerId ? " (owner)" : ""}
                </span>
              ))}
              {hiddenMemberCount ? (
                <button
                  className="group-details-page__members-more"
                  onClick={() => setIsMembersOpen(true)}
                  type="button"
                >
                  +{hiddenMemberCount} more
                </button>
              ) : (
                <button
                  className="group-details-page__members-more"
                  onClick={() => setIsMembersOpen(true)}
                  type="button"
                >
                  {isOwner && group.status === "open" ? "✏️" : "View All"}
                </button>
              )}
            </div>
          </div>

          <Row className="g-3 mt-2">
            <Col sm={4}>
              <Card className="rounded-3 overflow-hidden">
                <Card.Body>
                  <div className="text-muted">Total Spent</div>
                  <strong>{currency(summary.totalSpent)}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4}>
              <Card className="rounded-3 overflow-hidden">
                <Card.Body>
                  <div className="text-muted">Outstanding</div>
                  <strong>{currency(summary.outstandingDebtAmount)}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4}>
              <Card className="rounded-3 overflow-hidden">
                <Card.Body>
                  <div className="text-muted">Settled Debts</div>
                  <strong>{summary.settledDebtCount}</strong>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Row className="g-4">
        <Col lg={7}>
          <ExpenseList
            currentUserId={user._id}
            expenses={expenses}
            groupOwnerId={group.ownerId}
            groupStatus={group.status}
            onAddExpense={() => setIsExpenseOpen(true)}
            canAddExpense={!isWorking(ACTION.EXPENSE) && group.status === "open"}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setIsExpenseOpen(true);
            }}
          />
        </Col>
        <Col lg={5}>
          <BalanceSummary
            currentUserId={user._id}
            debts={debts}
            groupStatus={group.status}
            groupOwnerId={group.ownerId}
            isOwner={isOwner}
            isSettling={isWorking(ACTION.SETTLE)}
            isSubmitting={isWorking(ACTION.MARK_PAID)}
            onMarkPaid={(debtId) =>
              runAction(ACTION.MARK_PAID, () =>
                markDebtAsPaid(group._id, debtId),
              )
            }
            onSettleUp={handleSettleUp}
          />
        </Col>
      </Row>

      <AddExpenseForm
        key={editingExpense?._id ?? "new-expense"}
        isOpen={isExpenseOpen}
        initialValues={editingExpense}
        isSubmitting={isWorking(ACTION.EXPENSE)}
        members={members}
        onClose={() => {
          setEditingExpense(null);
          setIsExpenseOpen(false);
        }}
        onDelete={editingExpense ? () => handleDeleteExpense(editingExpense) : undefined}
        onSubmit={async (payload) => {
          if (editingExpense) {
            await runAction(ACTION.EXPENSE, async () => {
              await updateGroupExpense(group._id, editingExpense._id, payload);
              return fetchGroupDetails(group._id);
            });
          } else {
            await runAction(ACTION.EXPENSE, () =>
              createGroupExpense(group._id, payload),
            );
          }
          setEditingExpense(null);
          setIsExpenseOpen(false);
        }}
        submitLabel={expenseSubmitLabel}
        title={expenseFormTitle}
      />

      <MemberListModal
        groupName={group.name}
        isOpen={isMembersOpen}
        isOwner={isOwner && group.status === "open"}
        isSubmitting={isAnyWorking}
        members={members}
        onAddMember={async ({ email }) => {
          try {
            setWorkingActions((prev) => new Set(prev).add(ACTION.MEMBER));
            const nextData = await addGroupMember(group._id, email);
            setGroupData(nextData);
          } finally {
            setWorkingActions((prev) => {
              const next = new Set(prev);
              next.delete(ACTION.MEMBER);
              return next;
            });
          }
        }}
        onClose={() => setIsMembersOpen(false)}
        onRemoveMember={handleRemoveMember}
        ownerId={group.ownerId}
      />

      {confirm ? (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmVariant={confirm.confirmVariant}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </section>
  );
}
