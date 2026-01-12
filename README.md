# LinkedBoost AI

AI-powered LinkedIn assistant combining a Chrome Extension and WebApp.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
cd packages/web && npx prisma generate && cd ../..

# Start WebApp
npm run dev:web

# Build Chrome Extension
npm run build:extension
```

## 📦 Project Structure

```
linkedboost-ai/
├── packages/
│   ├── web/           # Next.js 15 WebApp (Dashboard)
│   ├── extension/     # Chrome Extension (LinkedIn integration)
│   └── shared/        # Shared TypeScript types
└── package.json       # Monorepo root
```

## ✨ Features

- **Smart Reply** - AI-generated message suggestions on LinkedIn
- **Post Writer** - Create engaging LinkedIn posts with AI
- **Profile Optimizer** - Get AI analysis and improvement tips
- **Job Matcher** - Analyze how well you match job postings

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| WebApp | Next.js 15, React 19, TypeScript |
| Extension | Vite, React 18, CRXJS |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js (Google/LinkedIn) |
| AI | OpenAI GPT-4 |

## 🔧 Configuration

1. Copy `.env.example` to `.env.local` in `packages/web/`
2. Fill in your API keys:
   - Database URL
   - Google/LinkedIn OAuth credentials
   - OpenAI API key

## 📱 Loading the Extension

1. Build: `npm run build:extension`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/extension/dist`

## 📄 License

MIT
