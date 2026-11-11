# Site Control Hub

One small backend on [Render](https://render.com) that every site can check before serving traffic. Flip a single switch (or call one API) to take **all** frontends offline and show the same **title** and **message** to users.

## Quick start (local)

```bash
cp .env.example .env
# Edit ADMIN_API_KEY in .env
npm install
npm run dev
```

- Public status: `GET http://localhost:3000/api/v1/status`
- Health: `GET http://localhost:3000/health`

## Admin API

Send your secret on every admin request:

- Header: `Authorization: Bearer <ADMIN_API_KEY>`, or
- Header: `X-Admin-Key: <ADMIN_API_KEY>`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/admin/control` | Read full state |
| `PATCH` | `/api/v1/admin/control` | Set `enabled`, `title`, `message` |
| `POST` | `/api/v1/admin/toggle` | Flip `enabled` only |

### Turn all sites off with a reason

```bash
curl -X PATCH "https://YOUR-SERVICE.onrender.com/api/v1/admin/control" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false,
    "title": "Paused for maintenance",
    "message": "We turned off hosting temporarily while billing is sorted. Thank you for your patience."
  }'
```

### Turn everything back on

```bash
curl -X PATCH "https://YOUR-SERVICE.onrender.com/api/v1/admin/control" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Public response shape

```json
{
  "enabled": false,
  "title": "Paused for maintenance",
  "message": "We turned off hosting temporarily...",
  "updatedAt": "2026-11-11T10:00:00.000Z"
}
```

When `enabled` is `false`, each site should show a maintenance screen using `title` and `message` instead of the normal app.

**Recommended:** call the status API from **server-side** middleware or a server component so the key is never exposed and you can block before loading heavy bundles.

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** and point at `render.yaml`, or **New Web Service** with:
   - Build: `npm install`
   - Start: `npm start`
   - Health check path: `/health`
3. Set env var `ADMIN_API_KEY` (generate a long random string).
4. Use the included disk mount (`DATA_DIR=/var/data`) so the toggle state survives redeploys.

Free tier: the service may sleep when idle; the first status request after sleep can be slow. For a kill switch that is usually fine.

## Wire each frontend

1. Set `SITE_CONTROL_URL=https://YOUR-SERVICE.onrender.com` in the app’s env.
2. On each request (or at build time for static sites — prefer per-request), `GET ${SITE_CONTROL_URL}/api/v1/status`.
3. If `enabled === false`, respond with HTTP 503 and render a maintenance page.

Examples live in `integrations/`.

### Next.js (middleware)

See `integrations/nextjs-middleware.example.ts`.

### React (client bootstrap)

See `integrations/react-maintenance.example.tsx` — use only if you already gate with SSR/middleware; client-only checks can flash content before maintenance appears.

### Static / CDN

Run a tiny edge function or use your host’s redirect rules to fetch status and serve a static `maintenance.html` when disabled.

## Security notes

- Never commit `.env` or expose `ADMIN_API_KEY` in frontends.
- Public `/api/v1/status` is intentionally unauthenticated; it only returns non-secret copy.
- Restrict `CORS_ORIGINS` in production if browsers call the API directly (server-side fetch does not need CORS).

## License

MIT
