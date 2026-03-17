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
