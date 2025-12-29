# Getting Started with Shajara

Shajara (شجرة) is an Arabic-first family tree application built with Next.js and deployed on Cloudflare Pages.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for deployment)
- Wrangler CLI (`npm install -g wrangler`)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/shajara.git
cd shajara
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure required environment variables:

```env
# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 3. Database Setup

For local development with D1:

```bash
# Create local database
npx wrangler d1 create shajara-db --local

# Run migrations
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
shajara/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── [locale]/        # Internationalized routes (ar/en)
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   ├── onboarding/      # Onboarding tour
│   │   ├── tree/            # Family tree visualization
│   │   └── ui/              # UI primitives
│   ├── lib/                 # Utilities and business logic
│   │   ├── ai/              # AI integration (OpenRouter)
│   │   ├── auth/            # Authentication
│   │   ├── db/              # Database queries
│   │   └── monitoring/      # Logging and metrics
│   ├── i18n/                # Internationalization
│   └── types/               # TypeScript types
├── migrations/              # D1 database migrations
├── scripts/                 # Build and utility scripts
├── docs/                    # Documentation
└── e2e/                     # End-to-end tests
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run db:migrate` | Run database migrations locally |
| `npm run db:migrate:prod` | Run migrations on production |

## Key Features

### Arabic-First Design
- Full RTL support
- Beautiful Arabic typography (Amiri, Cairo, Tajawal fonts)
- Bilingual interface (Arabic/English)

### Family Tree Visualization
- Interactive canvas with React Flow
- Smooth pan and zoom
- Keyboard navigation support
- Accessibility features (ARIA labels, screen reader support)

### AI Assistant
- Natural language input for adding family members
- Voice input support
- Smart relationship detection
- Bilingual understanding

### Progressive Web App
- Installable on mobile devices
- Offline support
- Push notifications (planned)

## Development Workflow

### Creating a New Feature

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Create a pull request

### Database Changes

1. Create a new migration file in `migrations/`
2. Follow the naming convention: `0XXX_description.sql`
3. Run locally: `npm run db:migrate`
4. Test thoroughly before deploying

### Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## Troubleshooting

### Common Issues

**Issue: "Error: D1_ERROR"**
- Ensure your database is created and migrations are run
- Check wrangler.json for correct database binding

**Issue: "API route returns 500"**
- Check environment variables are set
- Review logs in Cloudflare dashboard

**Issue: "Fonts not loading"**
- Clear browser cache
- Verify font files are included in build

## Getting Help

- [Documentation](./docs/)
- [Issue Tracker](https://github.com/your-org/shajara/issues)
- [Discord Community](https://discord.gg/your-invite)

## License

MIT License - see [LICENSE](../LICENSE) for details.
