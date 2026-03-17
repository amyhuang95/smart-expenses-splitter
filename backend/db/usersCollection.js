import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";
import { logger } from "../utils/logger.js";

const USERS_COLLECTION = "users";

export function getUsersCollection() {
  return getDB().collection(USERS_COLLECTION);
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Exclude sensitive fields and convert mongo ObjectId to string
export function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    groups: user.groups ?? [],
    dateCreated: user.dateCreated,
  };
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  logger.debug("[users] findOne by email", { email: normalized });
  const user = await getUsersCollection().findOne({ email: normalized });
  logger.debug("[users] findOne by email OK", {
    email: normalized,
    found: user !== null,
  });
  return user;
}

export async function findUserById(userId) {
  if (!ObjectId.isValid(userId)) {
    logger.warn("[users] findUserById — invalid userId", { userId });
    return null;
  }

  logger.debug("[users] findOne by id", { userId });
  const user = await getUsersCollection().findOne({
    _id: ObjectId.createFromHexString(userId),
  });
  logger.debug("[users] findOne by id OK", { userId, found: user !== null });
  return user;
}

export async function listUsers() {
  logger.debug("[users] find all");
  const users = await getUsersCollection()
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ dateCreated: -1 })
    .toArray();
  logger.debug("[users] find all OK", { count: users.length });
  return users;
}

export async function findUsersByIds(userIds) {
  const objectIds = [...new Set(userIds)]
    .filter((userId) => ObjectId.isValid(userId))
    .map((userId) => ObjectId.createFromHexString(userId));

  if (!objectIds.length) {
    logger.debug("[users] findUsersByIds — empty id list, skipping query");
    return [];
  }

  logger.debug("[users] find by ids", { count: objectIds.length });
  const users = await getUsersCollection()
    .find({ _id: { $in: objectIds } }, { projection: { passwordHash: 0 } })
    .toArray();
  logger.debug("[users] find by ids OK", {
    requested: objectIds.length,
    found: users.length,
  });
  return users;
}

export async function createUser({ name, email, passwordHash }) {
  const user = {
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash,
    groups: [],
    dateCreated: new Date(),
  };

  logger.debug("[users] insertOne", { email: user.email, name: user.name });
  const result = await getUsersCollection().insertOne(user);
  logger.debug("[users] insertOne OK", {
    userId: result.insertedId.toString(),
  });

  return {
    ...user,
    _id: result.insertedId,
  };
}

export async function addGroupToUsers(userIds, groupId) {
  const objectIds = [...new Set(userIds)]
    .filter((userId) => ObjectId.isValid(userId))
    .map((userId) => ObjectId.createFromHexString(userId));

  if (!objectIds.length) {
    logger.debug("[users] addGroupToUsers — empty id list, skipping query");
    return;
  }

  logger.debug("[users] updateMany addGroupToUsers", {
    groupId,
    userCount: objectIds.length,
  });
  await getUsersCollection().updateMany(
    { _id: { $in: objectIds } },
    { $addToSet: { groups: groupId } },
  );
  logger.debug("[users] updateMany addGroupToUsers OK", {
    groupId,
    userCount: objectIds.length,
  });
}

export async function removeGroupFromUsers(userIds, groupId) {
  const objectIds = [...new Set(userIds)]
    .filter((userId) => ObjectId.isValid(userId))
    .map((userId) => ObjectId.createFromHexString(userId));

  if (!objectIds.length) {
    logger.debug(
      "[users] removeGroupFromUsers — empty id list, skipping query",
    );
    return;
  }

  logger.debug("[users] updateMany removeGroupFromUsers", {
    groupId,
    userCount: objectIds.length,
  });
  await getUsersCollection().updateMany(
    { _id: { $in: objectIds } },
    { $pull: { groups: groupId } },
  );
  logger.debug("[users] updateMany removeGroupFromUsers OK", {
    groupId,
    userCount: objectIds.length,
  });
}
