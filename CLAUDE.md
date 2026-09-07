# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lab is a self-hosted HTML project hosting platform. Users upload single-file HTML projects, each gets a random hex slug, and the file is served at `/projects/:slug`. The repo has two sub-projects: `server/` and `web/`.

## Development Commands

### Server (`server/` — Bun + Hono + Drizzle ORM + SQLite)

```bash
cd server
bun install          # Install dependencies
bun run dev          # Dev server with hot reload (port 3000)
bun run build        # Build to dist/index.js
bun run start        # Run production build
```

### Web (`web/` — Bun + Vue 3 + Vite + TypeScript)

```bash
cd web
bun install          # Install dependencies
bun run dev          # Vite dev server
bun run build        # Type-check + build to web/dist/
bun run preview      # Preview production build
```

### Production Deployment

```bash
docker compose up -d --build   # Build both images and start the stack
```

No host-side build step is needed: `web/Dockerfile` is a multi-stage build (Bun compiles the
frontend, then the `dist/` output is copied into a `caddy:alpine` image), and `server/Dockerfile`
runs `bun run build` inside the image. `Caddyfile` is still bind-mounted, so editing it only needs
a `docker compose restart caddy`.

The Docker setup exposes port 8089 on the host, mapping to Caddy on port 80.

## Architecture

### Request Routing (Caddy → `Caddyfile`)
- `/api/*` and `/projects/*` → reverse proxied to Bun server at `lab-server:3000`
- Everything else → served as static files with SPA fallback (built `dist/` baked into the `lab-web` image)

### Server (`server/src/`)
- `index.ts` — Hono app with all REST routes
- `database.ts` — SQLite connection via `bun:sqlite` + Drizzle ORM; `initDatabase()` creates tables via raw SQL on startup (no migration files)
- `schema.ts` — Drizzle table definitions for `projects` and `files`
- DB file lives at `server/data/uploads.db` (persisted via Docker volume `lab-data`)

**API endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects (supports `?search=`) |
| GET | `/api/projects/:slug` | Project detail with files |
| POST | `/api/upload` | Upload new HTML project (`multipart/form-data`: `file`, `projectName`) |
| PUT | `/api/projects/:slug` | Update project name and/or file |
| PATCH | `/api/projects/:slug/toggle` | Toggle active/inactive |
| DELETE | `/api/projects/:slug` | Delete project and its files |
| GET | `/projects/:slug` | Serve the HTML file content directly |

Projects store HTML file content as text in SQLite. Each project has a 12-char hex slug (`randomBytes(6).toString('hex')`). Inactive projects return 403 on the serve route.

### Web (`web/src/`)
- `services/api.ts` — All API calls; auto-detects base URL (localhost → `http://localhost:3000/api`, else same-origin `/api`)
- `composables/useProjects.ts` — Project list state and fetch/search logic
- `composables/useMessage.ts` — Toast/notification state
- `types/index.ts` — Shared TypeScript interfaces (`Project`, `ProjectFile`, `ProjectDetail`, etc.)
- Components: `ProjectUpload.vue` (upload form), `ProjectList.vue` (list + search), `ProjectCard.vue` (individual project with edit/delete/toggle)

### Key Constraints
- Only `.html` files are accepted, max 5MB, project name max 20 chars (50 on update)
- File content is stored as text in SQLite, not on disk
- No authentication — this is intended for internal/lab use
