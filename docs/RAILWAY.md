# Railway Deployment Guide

This guide covers deploying BaoBuildBuddy to [Railway](https://railway.app/) with proper secrets handling for public-facing repositories.

## Overview

The `railway.json` config supports a **two-service** deployment (recommended):

- **@bao/server**: Elysia API on `https://baoserver-production.up.railway.app`
- **@bao/client**: Nuxt SSR on `https://baoclient-production.up.railway.app`

**Important**: Set the @bao/client service **Root Directory** to `/` (repo root) in Railway Dashboard → Service → Settings → Source. Otherwise the build will fail.

## Prerequisites

- [Railway CLI](https://docs.railway.com/cli): `bun install -g @railway/cli`
- Railway account
- Project ID (from your Railway dashboard URL)

## Quick Deploy via CLI

```bash
# 1. Login
railway login

# 2. Link to your existing project (use project ID from dashboard)
railway link 75c99e79-2609-45ed-96c9-01806178c76b

# 3. Deploy
railway up
```

## Secrets and Environment Variables

**Never commit secrets to the repository.** Configure all sensitive values in the Railway dashboard (Project → Variables) or via CLI.

### Required Variables (set in Railway Dashboard)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_PATH` | SQLite database path (use Railway volume mount) | `/data/bao.db` |
| `CORS_ORIGINS` | Allowed origins (include your Railway domain) | `https://your-app.railway.app` |

### Optional AI Provider Keys (set in Dashboard only)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI cloud provider |
| `GEMINI_API_KEY` | Google Gemini |
| `CLAUDE_API_KEY` | Anthropic Claude |
| `HUGGINGFACE_TOKEN` | HuggingFace Inference API |

### Client Service Variables (for two-service setup)

Set these on **@bao/client** so the Nuxt app reaches the API:

| Variable | Value |
|----------|-------|
| `NUXT_PUBLIC_API_BASE` | `https://baoserver-production.up.railway.app` |
| `NUXT_PUBLIC_WS_BASE` | `wss://baoserver-production.up.railway.app` |

### Production Auth

For production, **do not** set `BAO_DISABLE_AUTH=true`. Configure API keys via Settings UI or `PUT /api/settings`.

## Persistent Storage (SQLite)

Railway's filesystem is ephemeral. To persist the database:

1. In Railway Dashboard → your service → **Volumes**
2. Add a volume (e.g. mount path `/data`)
3. Set `DB_PATH=/data/bao.db` in Variables

## Linking Without Exposing Project ID

The `.railway` directory (created by `railway link`) stores your project link. It is in `.gitignore` and must not be committed. Each developer runs `railway link` locally.

For CI/CD, use a [Project Token](https://docs.railway.app/guides/project-tokens) instead:

```bash
RAILWAY_TOKEN=your-project-token railway up
```

Store `RAILWAY_TOKEN` in your CI secrets (e.g. GitHub Actions secrets).

## Health Check

The deployment uses `/api/health` as the healthcheck path. Ensure this endpoint returns a healthy status for Railway's readiness probes.

## Troubleshooting

- **Build fails**: Ensure `bun run build` succeeds locally. Run `bun run typecheck` and `bun run lint` first.
- **DB errors**: Verify `DB_PATH` points to a volume mount if using persistent storage.
- **Client returns 426 or wrong port**: Set @bao/client **Root Directory** to `/` (repo root) in Railway Dashboard. The client must build from the monorepo root to resolve `@bao/shared` and server types.
- **CORS errors**: Add the client domain to `CORS_ORIGINS` on @bao/server, e.g. `https://baoclient-production.up.railway.app`.
