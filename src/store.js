import { MongoClient } from "mongodb";
import { decodeWithSeed, MONGO_CIPHER } from "./secrets.js";

const DEFAULT_TITLE = "Service temporarily unavailable";
const DEFAULT_MESSAGE =
  "This site is paused. Please check back later.";

const COLLECTION = "control_state";
const DOC_ID = "global";

function defaultState() {
  return {
    enabled: true,
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
    updatedAt: new Date().toISOString(),
  };
}

function fromDoc(doc) {
  if (!doc) return defaultState();
  return {
    enabled: Boolean(doc.enabled),
    title: String(doc.title || DEFAULT_TITLE),
    message: String(doc.message || DEFAULT_MESSAGE),
    updatedAt: String(doc.updatedAt || new Date().toISOString()),
  };
}

/** @typedef {{ client: MongoClient, col: import('mongodb').Collection }} Store */

/** @returns {Promise<Store>} */
export async function openStore() {
  const uri = decodeWithSeed(MONGO_CIPHER);
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  await client.connect();
  const col = client.db().collection(COLLECTION);

  const existing = await col.findOne({ _id: DOC_ID });
  if (!existing) {
    const seed = { _id: DOC_ID, ...defaultState() };
    await col.insertOne(seed);
  }

  return { client, col };
}

/** @param {Store} store */
export async function getControl(store) {
  const doc = await store.col.findOne({ _id: DOC_ID });
  return fromDoc(doc);
}

/** @param {Store} store */
export async function setControl(store, { enabled, title, message }) {
  const current = await getControl(store);
  const next = {
    enabled: enabled !== undefined ? Boolean(enabled) : current.enabled,
    title: title !== undefined ? String(title).trim() : current.title,
    message: message !== undefined ? String(message).trim() : current.message,
    updatedAt: new Date().toISOString(),
  };

  if (!next.title) next.title = DEFAULT_TITLE;
  if (!next.message) next.message = DEFAULT_MESSAGE;

  await store.col.updateOne(
    { _id: DOC_ID },
    {
      $set: {
        enabled: next.enabled,
        title: next.title,
        message: next.message,
        updatedAt: next.updatedAt,
      },
    }
  );

  return next;
}
