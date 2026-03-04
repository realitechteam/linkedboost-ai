# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkedBoost AI is an AI-powered LinkedIn assistant with two main components: a Next.js web dashboard and a Chrome Extension that integrates directly into LinkedIn. It's structured as an npm workspaces monorepo with three packages.

## Commands

```bash
# Install all dependencies
npm install

# Development
npm run dev:web          # Start Next.js web app on port 3000
npm run dev:extension    # Start Vite dev build for extension

# Build
npm run build:web        # Production build for web app
npm run build:extension  # Build extension to packages/extension/dist

# Code quality
npm run lint             # ESLint across all packages
npm run format           # Prettier across all packages

# Database (run from packages/web)
cd packages/web
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open database GUI
```

## Architecture

### Monorepo Packages

- **`packages/web`** (`@linkedboost/web`) — Next.js 15 / React 19 full-stack app. Serves the dashboard UI and all API endpoints. Uses App Router with `(dashboard)` route group for authenticated pages.
- **`packages/extension`** (`@linkedboost/extension`) — Chrome Extension (Manifest V3) built with Vite + CRXJS + React 18. Injects UI into LinkedIn pages.
- **`packages/shared`** (`@linkedboost/shared`) — Shared TypeScript type definitions. Both web and extension depend on this. Exports via `@linkedboost/shared` and `@linkedboost/shared/types`.

### Web App Structure (`packages/web/src`)

- `app/(dashboard)/` — Protected routes: profile, posts, jobs, settings, admin, etc.
- `app/api/ai/` — AI feature endpoints: `reply-suggest`, `post-generate`, `profile-analyze`, `job-match`
- `app/api/profile/` — LinkedIn profile CRUD: `sync`, `fetch`, `delete`
- `app/api/auth/` — NextAuth routes + `session-check` for extension auth
- `lib/` — Auth config (NextAuth v5 beta with Google/LinkedIn OAuth), Prisma client, utilities
- `components/ui/` — Reusable UI components

### Extension Structure (`packages/extension/src`)

Three execution contexts:
- **Background** (`background/index.ts`) — Service worker handling message passing and API calls to web app
- **Content** (`content/index.tsx`) — Injected into LinkedIn pages. Detects page type (messaging/profile/jobs) and renders React components: `ReplyHelper`, `ProfileBadge`, `FloatingControls`
- **Popup** (`popup/App.tsx`) — Extension popup UI showing auth status, feature cards, usage stats

### Extension-Web Communication

The extension communicates with the web app via REST API calls from the background service worker. Auth flows through `/api/auth/session-check`. Profile data syncs via DOM scraping on LinkedIn, sent through background worker to `/api/profile/sync`.

### Database

Prisma ORM with SQLite for local dev (file at `packages/web/prisma/dev.db`). Schema has 11 models: User, Account, Session, VerificationToken, Subscription, LinkedInProfile, PostDraft, JobMatch, UsageRecord. Several models store structured data as JSON strings (experience, education, skills, hashtags, analysis).

### Usage Limits

Feature usage is tracked per-user per-day via `UsageRecord`. Three plan tiers (FREE/PRO/PREMIUM) with limits defined in `USAGE_LIMITS` constant in `packages/shared/src/types/index.ts`.

## Key Configuration

- **Environment**: Copy `packages/web/.env.example` to `packages/web/.env.local`. Requires OAuth credentials (Google/LinkedIn), OpenAI API key, and optionally Stripe keys.
- **Database URL**: `DATABASE_URL="file:./dev.db"` for local SQLite
- **Extension host permissions**: Hardcoded to `http://localhost:3000` — must change for production
- **Path alias**: Web app uses `@/*` mapping to `./src/*` in tsconfig
- **Extension UI language**: Primarily Vietnamese

## Loading the Extension

1. Run `npm run build:extension`
2. Open `chrome://extensions`, enable Developer mode
3. Click "Load unpacked" and select `packages/extension/dist`
