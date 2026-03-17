import { ObjectId } from "mongodb";
import { getDB } from "./connection.js";

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
  return getUsersCollection().findOne({ email: normalizeEmail(email) });
}

export async function findUserById(userId) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return getUsersCollection().findOne({
    _id: ObjectId.createFromHexString(userId),
  });
}

export async function listUsers() {
  return getUsersCollection()
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ dateCreated: -1 })
    .toArray();
}

export async function createUser({ name, email, passwordHash }) {
  const user = {
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash,
    groups: [],
    dateCreated: new Date(),
  };

  const result = await getUsersCollection().insertOne(user);
  return {
    ...user,
    _id: result.insertedId,
  };
}
