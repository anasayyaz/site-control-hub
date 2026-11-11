import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TITLE = "Service temporarily unavailable";
const DEFAULT_MESSAGE =
  "This site is paused. Please check back later.";

export function openDb(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "control.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS control (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const row = db.prepare("SELECT id FROM control WHERE id = 1").get();
  if (!row) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO control (id, enabled, title, message, updated_at)
       VALUES (1, 1, ?, ?, ?)`
    ).run(DEFAULT_TITLE, DEFAULT_MESSAGE, now);
  }

  return db;
}

export function getControl(db) {
  const row = db
    .prepare(
      `SELECT enabled, title, message, updated_at AS updatedAt FROM control WHERE id = 1`
    )
    .get();
  return {
    enabled: Boolean(row.enabled),
    title: row.title,
    message: row.message,
    updatedAt: row.updatedAt,
  };
}

export function setControl(db, { enabled, title, message }) {
  const current = getControl(db);
  const next = {
    enabled: enabled !== undefined ? Boolean(enabled) : current.enabled,
    title: title !== undefined ? String(title).trim() : current.title,
    message: message !== undefined ? String(message).trim() : current.message,
    updatedAt: new Date().toISOString(),
  };

  if (!next.title) next.title = DEFAULT_TITLE;
  if (!next.message) next.message = DEFAULT_MESSAGE;

  db.prepare(
    `UPDATE control SET enabled = ?, title = ?, message = ?, updated_at = ?
     WHERE id = 1`
  ).run(
    next.enabled ? 1 : 0,
    next.title,
    next.message,
    next.updatedAt
  );

  return next;
}
