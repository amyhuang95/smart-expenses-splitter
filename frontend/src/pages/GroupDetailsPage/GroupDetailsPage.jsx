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
import AddMemberForm from "../../components/AddMemberForm/AddMemberForm.jsx";
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

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [groupData, setGroupData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [workingActions, setWorkingActions] = useState(new Set());
  const [editingExpense, setEditingExpense] = useState(null);

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
    const didConfirm = window.confirm(
      `Remove ${member.name} from "${groupData.group.name}"?`,
    );

    if (!didConfirm) {
      return;
    }

    await runAction(ACTION.MEMBER, () =>
      removeGroupMember(groupData.group._id, member._id),
    );
  }

  async function handleSettleUp() {
    const didConfirm = window.confirm(
      `Settle up "${groupData.group.name}"? This will lock the group and prevent further edits.`,
    );

    if (!didConfirm) {
      return;
    }

    await runAction(ACTION.SETTLE, () => settleGroup(groupData.group._id));
  }

  async function handleDeleteGroup() {
    const didConfirm = window.confirm(
      `Delete "${groupData.group.name}"? This will permanently remove the group and all of its shared expenses.`,
    );

    if (!didConfirm) {
      return;
    }

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
  }

  async function handleDeleteExpense(expense) {
    const didConfirm = window.confirm(
      `Delete "${expense.name}" from "${groupData.group.name}"? This cannot be undone.`,
    );

    if (!didConfirm) {
      return;
    }

    await runAction(ACTION.EXPENSE, () =>
      deleteGroupExpense(groupData.group._id, expense._id),
    );

    if (editingExpense?._id === expense._id) {
      setEditingExpense(null);
      setIsExpenseOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="group-details-page__loading">
        <Spinner animation="border" role="status" variant="dark" />
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="group-details-page__not-found">
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
  const expenseFormTitle = editingExpense
    ? "Edit Shared Expense"
    : "Add Shared Expense";
  const expenseSubmitLabel = editingExpense ? "Save Changes" : "Save Expense";
  const previewMembers = group.members.slice(0, MEMBER_PREVIEW_LIMIT);
  const hiddenMemberCount = Math.max(
    group.members.length - MEMBER_PREVIEW_LIMIT,
    0,
  );

  return (
    <section className="group-details-page">
      <div className="group-details-page__backlink">
        <Button as={Link} to="/groups" type="button" variant="link">
          Back to groups
        </Button>
      </div>

      <Card className="group-details-page__hero">
        <Card.Body>
          <div className="group-details-page__hero-top">
            <div>
              <p className="groups-page__eyebrow">Group Detail</p>
              <Badge
                bg={
                  group.status === "settled"
                    ? "success"
                    : group.status === "settling"
                      ? "warning"
                      : "primary"
                }
              >
                {group.status}
              </Badge>
              <h1>{group.name}</h1>
            </div>
            <div className="group-details-page__hero-actions">
              <Button
                disabled={isWorking(ACTION.EXPENSE) || group.status !== "open"}
                onClick={() => setIsExpenseOpen(true)}
                type="button"
                variant="dark"
              >
                Add Expense
              </Button>
              {isOwner ? (
                <Button
                  disabled={isWorking(ACTION.MEMBER) || group.status !== "open"}
                  onClick={() => setIsAddMemberOpen(true)}
                  type="button"
                  variant="outline-dark"
                >
                  Add Member
                </Button>
              ) : null}
              {isOwner ? (
                <Button
                  disabled={isWorking(ACTION.SETTLE) || group.status !== "open"}
                  onClick={handleSettleUp}
                  type="button"
                  variant="outline-dark"
                >
                  {isWorking(ACTION.SETTLE) ? "Settling…" : "Settle Up"}
                </Button>
              ) : null}
              {isOwner ? (
                <Button
                  disabled={isWorking(ACTION.DELETE)}
                  onClick={handleDeleteGroup}
                  type="button"
                  variant="outline-danger"
                >
                  {isWorking(ACTION.DELETE) ? "Deleting..." : "Delete Group"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="group-details-page__members-section">
            <div className="group-details-page__members">
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
              ) : null}
            </div>
          </div>

          <div className="group-details-page__stats">
            <Card className="group-details-page__stat-card">
              <Card.Body>
                <div className="text-muted">Total Spent</div>
                <strong>{currency(summary.totalSpent)}</strong>
              </Card.Body>
            </Card>
            <Card className="group-details-page__stat-card">
              <Card.Body>
                <div className="text-muted">Outstanding</div>
                <strong>{currency(summary.outstandingDebtAmount)}</strong>
              </Card.Body>
            </Card>
            <Card className="group-details-page__stat-card">
              <Card.Body>
                <div className="text-muted">Settled Debts</div>
                <strong>{summary.settledDebtCount}</strong>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Row className="g-4">
        <Col lg={8}>
          <ExpenseList
            currentUserId={user._id}
            expenses={expenses}
            groupOwnerId={group.ownerId}
            groupStatus={group.status}
            onDelete={handleDeleteExpense}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setIsExpenseOpen(true);
            }}
          />
        </Col>
        <Col lg={4}>
          <BalanceSummary
            currentUserId={user._id}
            debts={debts}
            groupStatus={group.status}
            isSubmitting={isWorking(ACTION.MARK_PAID)}
            onMarkPaid={(debtId) =>
              runAction(ACTION.MARK_PAID, () =>
                markDebtAsPaid(group._id, debtId),
              )
            }
          />
        </Col>
      </Row>

      <AddExpenseForm
        key={editingExpense?._id ?? "new-expense"}
        isOpen={isExpenseOpen}
        initialValues={editingExpense}
        isSubmitting={isWorking(ACTION.EXPENSE)}
        members={group.members}
        onClose={() => {
          setEditingExpense(null);
          setIsExpenseOpen(false);
        }}
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
      <AddMemberForm
        isOpen={isAddMemberOpen}
        isSubmitting={isWorking(ACTION.MEMBER)}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={async (email) => {
          await runAction(ACTION.MEMBER, () =>
            addGroupMember(group._id, email),
          );
          setIsAddMemberOpen(false);
        }}
      />
      <MemberListModal
        groupName={group.name}
        isOpen={isMembersOpen}
        isOwner={isOwner && group.status === "open"}
        isSubmitting={isAnyWorking}
        members={group.members}
        onClose={() => setIsMembersOpen(false)}
        onRemoveMember={handleRemoveMember}
        ownerId={group.ownerId}
      />
    </section>
  );
}
