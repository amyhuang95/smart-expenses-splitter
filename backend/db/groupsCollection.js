import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";
import { deleteGroupExpensesByGroupId } from "./groupExpensesCollection.js";
import { logger } from "../utils/logger.js";

const GROUPS_COLLECTION = "groups";

export function getGroupsCollection() {
  return getDB().collection(GROUPS_COLLECTION);
}

export function serializeDebt(debt) {
  return {
    debtId: debt.debtId,
    senderId: debt.senderId,
    receiverId: debt.receiverId,
    amount: Number(debt.amount),
    isPaid: Boolean(debt.isPaid),
    paidAt: debt.paidAt ?? null,
  };
}

export function serializeGroup(group) {
  if (!group) {
    return null;
  }

  return {
    _id: group._id.toString(),
    name: group.name,
    ownerId: group.ownerId?.toString(),
    memberIds: group.memberIds ?? [],
    status: group.status ?? "open",
    debts: (group.debts ?? []).map(serializeDebt),
    dateCreated: group.dateCreated,
  };
}

export async function createGroup({ name, ownerId, memberIds }) {
  const group = {
    name: name.trim(),
    ownerId,
    memberIds: [...new Set([ownerId, ...memberIds])],
    status: "open",
    debts: [],
    dateCreated: new Date(),
  };

  logger.debug("[groups] insertOne", {
    name: group.name,
    ownerId,
    memberCount: group.memberIds.length,
  });
  const result = await getGroupsCollection().insertOne(group);
  logger.debug("[groups] insertOne OK", {
    groupId: result.insertedId.toString(),
  });

  return {
    ...group,
    _id: result.insertedId,
  };
}

/**
 * Compensating delete used when the post-create user sync fails.
 * Removes the group document so the two collections stay consistent.
 */
export async function deleteGroupById(groupId) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] deleteGroupById — invalid groupId", { groupId });
    return;
  }

  logger.debug("[groups] deleteOne (compensating)", { groupId });
  await getGroupsCollection().deleteOne({
    _id: ObjectId.createFromHexString(groupId.toString()),
  });
  logger.debug("[groups] deleteOne OK", { groupId });
}

export async function deleteGroupAndExpenses(groupId) {
  logger.debug("[groups] deleteGroupAndExpenses start", { groupId });
  await Promise.all([
    deleteGroupById(groupId),
    deleteGroupExpensesByGroupId(groupId),
  ]);
  logger.debug("[groups] deleteGroupAndExpenses OK", { groupId });
}

export async function listGroupsByMember(userId) {
  logger.debug("[groups] find by member", { userId });
  const groups = await getGroupsCollection()
    .find({ memberIds: userId })
    .sort({ dateCreated: -1 })
    .toArray();
  logger.debug("[groups] find by member OK", { userId, count: groups.length });
  return groups;
}

export async function findGroupById(groupId) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] findGroupById — invalid groupId", { groupId });
    return null;
  }

  logger.debug("[groups] findOne", { groupId });
  const group = await getGroupsCollection().findOne({
    _id: ObjectId.createFromHexString(groupId),
  });
  logger.debug("[groups] findOne OK", { groupId, found: group !== null });
  return group;
}

export async function addMemberToGroup(groupId, memberId) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] addMemberToGroup — invalid groupId", { groupId });
    return null;
  }

  logger.debug("[groups] updateOne addMemberToGroup", { groupId, memberId });
  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    { $addToSet: { memberIds: memberId } },
  );
  logger.debug("[groups] updateOne addMemberToGroup OK", { groupId, memberId });

  return findGroupById(groupId);
}

export async function removeMemberFromGroup(groupId, memberId) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] removeMemberFromGroup — invalid groupId", {
      groupId,
    });
    return null;
  }

  logger.debug("[groups] updateOne removeMemberFromGroup", {
    groupId,
    memberId,
  });
  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    { $pull: { memberIds: memberId } },
  );
  logger.debug("[groups] updateOne removeMemberFromGroup OK", {
    groupId,
    memberId,
  });

  return findGroupById(groupId);
}

export async function updateGroupSettlement(groupId, { debts, status }) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] updateGroupSettlement — invalid groupId", {
      groupId,
    });
    return null;
  }

  logger.debug("[groups] updateOne settlement", {
    groupId,
    status,
    debtCount: debts.length,
  });
  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    {
      $set: {
        debts,
        status,
      },
    },
  );
  logger.debug("[groups] updateOne settlement OK", { groupId, status });

  return findGroupById(groupId);
}

export async function markGroupDebtPaid(groupId, debtId) {
  if (!ObjectId.isValid(groupId)) {
    logger.warn("[groups] markGroupDebtPaid — invalid groupId", { groupId });
    return null;
  }

  logger.debug("[groups] updateOne markDebtPaid", { groupId, debtId });
  await getGroupsCollection().updateOne(
    {
      _id: ObjectId.createFromHexString(groupId),
      "debts.debtId": debtId,
    },
    {
      $set: {
        "debts.$.isPaid": true,
        "debts.$.paidAt": new Date(),
      },
    },
  );
  logger.debug("[groups] updateOne markDebtPaid OK", { groupId, debtId });

  return findGroupById(groupId);
}

/**
 * Returns a lightweight summary for each group — just the group document
 * itself plus a pre-computed expense count and total. Used by the dashboard
 * GET / route to avoid fetching full expense arrays for every group.
 *
 * Uses a $lookup aggregation so all groups are resolved in two round trips
 * (one for groups, one for the joined expense aggregation) rather than
 * 2N trips when buildGroupPayload is called per group.
 */
export async function listGroupSummariesByMember(userId) {
  logger.debug("[groups] aggregate listGroupSummariesByMember", { userId });
  const groups = await getGroupsCollection()
    .aggregate([
      { $match: { memberIds: userId } },
      { $sort: { dateCreated: -1 } },
      {
        $lookup: {
          from: "groupExpenses",
          localField: "_id",
          foreignField: "groupId",
          as: "_expenseDocs",
          pipeline: [{ $project: { amount: 1 } }],
        },
      },
      {
        $addFields: {
          _expenseCount: { $size: "$_expenseDocs" },
          _totalSpent: { $sum: "$_expenseDocs.amount" },
        },
      },
      { $project: { _expenseDocs: 0 } },
    ])
    .toArray();
  logger.debug("[groups] aggregate listGroupSummariesByMember OK", {
    userId,
    count: groups.length,
  });
  return groups;
}
