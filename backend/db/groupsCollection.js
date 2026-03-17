import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";

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
    ownerId: group.ownerId,
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

  const result = await getGroupsCollection().insertOne(group);
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
    return;
  }

  await getGroupsCollection().deleteOne({
    _id: ObjectId.createFromHexString(groupId.toString()),
  });
}

export async function listGroupsByMember(userId) {
  return getGroupsCollection()
    .find({ memberIds: userId })
    .sort({ dateCreated: -1 })
    .toArray();
}

export async function findGroupById(groupId) {
  if (!ObjectId.isValid(groupId)) {
    return null;
  }

  return getGroupsCollection().findOne({
    _id: ObjectId.createFromHexString(groupId),
  });
}

export async function addMemberToGroup(groupId, memberId) {
  if (!ObjectId.isValid(groupId)) {
    return null;
  }

  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    { $addToSet: { memberIds: memberId } },
  );

  return findGroupById(groupId);
}

export async function removeMemberFromGroup(groupId, memberId) {
  if (!ObjectId.isValid(groupId)) {
    return null;
  }

  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    { $pull: { memberIds: memberId } },
  );

  return findGroupById(groupId);
}

export async function updateGroupSettlement(groupId, { debts, status }) {
  if (!ObjectId.isValid(groupId)) {
    return null;
  }

  await getGroupsCollection().updateOne(
    { _id: ObjectId.createFromHexString(groupId) },
    {
      $set: {
        debts,
        status,
      },
    },
  );

  return findGroupById(groupId);
}

export async function markGroupDebtPaid(groupId, debtId) {
  if (!ObjectId.isValid(groupId)) {
    return null;
  }

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

  return findGroupById(groupId);
}

/**
 * Returns a lightweight summary for each group — just the group document
 * itself plus a pre-computed expense count and total. Used by the dashboard
 * GET / route to avoid fetching full expense arrays for every group (#7).
 *
 * Uses a $lookup aggregation so all groups are resolved in two round trips
 * (one for groups, one for the joined expense aggregation) rather than
 * 2N trips when buildGroupPayload is called per group.
 */
export async function listGroupSummariesByMember(userId) {
  return getGroupsCollection()
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
}
