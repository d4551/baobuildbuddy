# Railway Deployment Guide

Deploy BaoBuildBuddy to [Railway](https://railway.app/) with a two-service setup.

---

## Overview

The `railway.json` config supports two services (recommended):

| Service        | URL                                                   |
|----------------|-------------------------------------------------------|
| `@bao/server`  | `https://baoserver-production.up.railway.app`         |
| `@bao/client`  | `https://baoclient-production.up.railway.app`         |

> **Important:** Set the `@bao/client` service **Root Directory** to `/` (repo root) in Railway Dashboard > Service > Settings > Source. Otherwise the build will fail.

---

## Prerequisites

- [Railway CLI](https://docs.railway.com/cli): `bun install -g @railway/cli`
- Railway account
- Project ID (from your Railway dashboard URL)

---

## Quick deploy

```bash
railway login
railway link 75c99e79-2609-45ed-96c9-01806178c76b
railway up
```

---

## Environment variables

**Never commit secrets to the repository.** Set all sensitive values in the Railway dashboard (Project > Variables) or via CLI.

### Required (set in Railway Dashboard)

| Variable       | Purpose                              | Example                          |
|----------------|--------------------------------------|----------------------------------|
| `DB_PATH`      | SQLite database path (use a volume)  | `/data/bao.db`                   |
| `CORS_ORIGINS` | Allowed origins                      | `https://your-app.railway.app`   |

### Optional AI provider keys

| Variable            | Purpose                   |
|---------------------|---------------------------|
| `OPENAI_API_KEY`    | OpenAI cloud provider     |
| `GEMINI_API_KEY`    | Google Gemini             |
| `CLAUDE_API_KEY`    | Anthropic Claude          |
| `HUGGINGFACE_TOKEN` | HuggingFace Inference API |

### Client service variables

Set these on `@bao/client` so the Nuxt app can reach the API:

| Variable                 | Value                                             |
|--------------------------|---------------------------------------------------|
| `NUXT_PUBLIC_API_BASE`   | `https://baoserver-production.up.railway.app`     |
| `NUXT_PUBLIC_WS_BASE`    | `wss://baoserver-production.up.railway.app`       |

### Production auth

Do **not** set `BAO_DISABLE_AUTH=true` in production. Configure API keys via Settings UI or `PUT /api/settings`.

---

## Persistent storage (SQLite)

Railway's filesystem is ephemeral. To persist the database:

1. Go to Railway Dashboard > your service > **Volumes**.
2. Add a volume (e.g. mount path `/data`).
3. Set `DB_PATH=/data/bao.db` in Variables.

---

## Project linking without exposing IDs

The `.railway` directory (created by `railway link`) stores your project link. It's in `.gitignore` and must not be committed.

For CI/CD, use a [Project Token](https://docs.railway.app/guides/project-tokens):

```bash
RAILWAY_TOKEN=your-project-token railway up
```

Store `RAILWAY_TOKEN` in your CI secrets (e.g. GitHub Actions).

---

## Health check

The deployment uses `/api/health` as the healthcheck path. Ensure this endpoint returns a healthy status for Railway's readiness probes.

---

## Troubleshooting

| Problem                       | Fix                                                                              |
|-------------------------------|----------------------------------------------------------------------------------|
| Build fails                   | Ensure `bun run build` succeeds locally. Run `bun run typecheck` and `lint` first. |
| DB errors                     | Verify `DB_PATH` points to a volume mount.                                       |
| Client returns 426 or wrong port | Set `@bao/client` Root Directory to `/` in Railway Dashboard.                 |
| CORS errors                   | Add the client domain to `CORS_ORIGINS` on `@bao/server`.                       |
