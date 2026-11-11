import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { getControl, openStore, setControl } from "./store.js";

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

if (!ADMIN_API_KEY) {
  console.warn(
    "[site-control-hub] ADMIN_API_KEY is not set — admin routes will reject all requests."
  );
}

const corsOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const store = await openStore();
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));

app.use(
  cors({
    origin:
      corsOrigins.length === 1 && corsOrigins[0] === "*"
        ? true
        : corsOrigins,
    methods: ["GET", "OPTIONS"],
  })
);

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", async (_req, res) => {
  try {
    await getControl(store);
    res.json({ ok: true, storage: "mongodb" });
  } catch (err) {
    res.status(503).json({ ok: false, error: "Database unavailable" });
  }
});

/** Public — frontends poll this (or cache via CDN). */
app.get("/api/v1/status", publicLimiter, async (_req, res) => {
  const control = await getControl(store);
  res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
  res.json({
    enabled: control.enabled,
    title: control.title,
    message: control.message,
    updatedAt: control.updatedAt,
  });
});

function requireAdmin(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ error: "Admin API not configured" });
  }
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.get("x-admin-key");
  if (!token || token !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/** Admin — read current state (includes same fields as public). */
app.get(
  "/api/v1/admin/control",
  adminLimiter,
  requireAdmin,
  async (_req, res) => {
    res.json(await getControl(store));
  }
);

/**
 * Admin — set enabled flag and/or user-facing copy.
 * Body: { "enabled": false, "title": "...", "message": "..." }
 */
app.patch("/api/v1/admin/control", adminLimiter, requireAdmin, async (req, res) => {
  const { enabled, title, message } = req.body ?? {};
  if (enabled !== undefined && typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be a boolean" });
  }
  const next = await setControl(store, { enabled, title, message });
  res.json(next);
});

/** Admin — flip enabled without changing message. */
app.post("/api/v1/admin/toggle", adminLimiter, requireAdmin, async (_req, res) => {
  const current = await getControl(store);
  const next = await setControl(store, { enabled: !current.enabled });
  res.json(next);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`site-control-hub listening on port ${PORT}`);
});
