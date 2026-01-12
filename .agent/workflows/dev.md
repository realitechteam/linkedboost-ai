---
description: How to run the LinkedBoost AI project in development mode
---

# LinkedBoost AI Development Workflow

## Prerequisites
- Node.js 20+
- npm 10+

## Setup

// turbo
1. Navigate to project directory:
```bash
cd /Users/bami/.gemini/antigravity/scratch/linkedboost-ai
```

// turbo
2. Install dependencies:
```bash
npm install
```

// turbo
3. Generate Prisma client:
```bash
cd packages/web && npx prisma generate && cd ../..
```

## Running the WebApp

// turbo
4. Start the development server:
```bash
npm run dev:web
```

The WebApp will be available at http://localhost:3000

## Building the Chrome Extension

// turbo
5. Build the extension:
```bash
npm run build:extension
```

6. Load the extension in Chrome:
- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `packages/extension/dist` folder

## Environment Variables

Create `.env.local` in `packages/web/`:
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."

# AI
OPENAI_API_KEY="..."
```

## Project Structure
- `packages/web` - Next.js WebApp
- `packages/extension` - Chrome Extension
- `packages/shared` - Shared TypeScript types
