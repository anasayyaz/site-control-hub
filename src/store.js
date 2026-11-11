import fs from "node:fs";
import path from "node:path";

const DEFAULT_TITLE = "Service temporarily unavailable";
const DEFAULT_MESSAGE =
  "This site is paused. Please check back later.";

function statePath(dataDir) {
  return path.join(dataDir, "control.json");
}

function defaultState() {
  return {
    enabled: true,
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
    updatedAt: new Date().toISOString(),
  };
}

function readState(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return {
      enabled: Boolean(data.enabled),
      title: String(data.title || DEFAULT_TITLE),
      message: String(data.message || DEFAULT_MESSAGE),
      updatedAt: String(data.updatedAt || new Date().toISOString()),
    };
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}

function writeState(filePath, state) {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.control.${process.pid}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

/** @typedef {{ filePath: string }} Store */

/** @returns {Store} */
export function openStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const filePath = statePath(dataDir);
  if (!readState(filePath)) {
    writeState(filePath, defaultState());
  }
  return { filePath };
}

/** @param {Store} store */
export function getControl(store) {
  return readState(store.filePath) ?? defaultState();
}

/** @param {Store} store */
export function setControl(store, { enabled, title, message }) {
  const current = getControl(store);
  const next = {
    enabled: enabled !== undefined ? Boolean(enabled) : current.enabled,
    title: title !== undefined ? String(title).trim() : current.title,
    message: message !== undefined ? String(message).trim() : current.message,
    updatedAt: new Date().toISOString(),
  };

  if (!next.title) next.title = DEFAULT_TITLE;
  if (!next.message) next.message = DEFAULT_MESSAGE;

  writeState(store.filePath, next);
  return next;
}
