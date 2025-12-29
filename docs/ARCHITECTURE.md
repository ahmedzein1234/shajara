# Shajara Architecture

## Overview

Shajara is a modern, serverless family tree application built with:

- **Frontend**: Next.js 15 with App Router
- **Backend**: Cloudflare Pages with Edge Functions
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (for images/media)
- **Cache**: Cloudflare KV
- **AI**: OpenRouter API (Claude/GPT models)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare Edge                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │     D1       │  │     R2       │          │
│  │  (Next.js)   │  │  (Database)  │  │  (Storage)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         ├─────────────────┼─────────────────┤                   │
│         │                 │                 │                   │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │   Workers    │  │     KV       │  │   Queues     │          │
│  │  (Edge API)  │  │   (Cache)    │  │  (Backups)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    OpenRouter     │
                    │    (AI API)       │
                    └───────────────────┘
```

## Data Model

### Core Entities

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────┐
│    User     │──────│      Tree       │──────│   Person    │
└─────────────┘      └─────────────────┘      └──────┬──────┘
                                                     │
                     ┌─────────────────┐             │
                     │  Relationship   │─────────────┘
                     └─────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
┌────┴─────┐          ┌─────┴─────┐         ┌─────┴─────┐
│  parent  │          │  spouse   │         │  sibling  │
└──────────┘          └───────────┘         └───────────┘
```

### Database Schema

**users**
- id, email, password_hash, name, avatar_url
- created_at, updated_at, last_login

**trees**
- id, name, description, owner_id
- visibility (private/public/family)
- created_at, updated_at

**persons**
- id, tree_id
- given_name, patronymic_chain, family_name
- full_name_ar, full_name_en
- gender, birth_date, death_date
- birth_place, current_location
- photo_url, notes

**relationships**
- id, tree_id
- person1_id, person2_id
- relationship_type (parent/spouse/sibling)
- metadata (marriage_date, etc.)

## Request Flow

### Page Load

```
1. Browser → Cloudflare Edge (nearest POP)
2. Edge → Check cache (KV)
3. If miss → Execute Next.js page
4. Next.js → Query D1 database
5. Return rendered page
6. Cache in KV (if applicable)
```

### API Request

```
1. Client → /api/endpoint
2. Middleware → Validate auth (session cookie)
3. Route handler → Business logic
4. Query D1 / Read R2
5. Return JSON response
6. Log to Cloudflare Analytics
```

### AI Extraction

```
1. User input → /api/ai/extract
2. Build context (existing family members)
3. Call OpenRouter API (Claude/GPT)
4. Parse structured response
5. Return extracted persons/relationships
6. User confirms → Save to D1
```

## Caching Strategy

### KV Cache Layers

1. **Tree Data Cache** (TTL: 5 minutes)
   - Key: `tree:{treeId}`
   - Invalidated on any tree modification

2. **Session Cache** (TTL: 24 hours)
   - Key: `session:{token}`
   - Sliding expiration

3. **User Preferences** (TTL: 1 hour)
   - Key: `user:{userId}:prefs`

### Cache Invalidation

- Write-through on mutations
- Tag-based invalidation for related entities
- Manual purge via API for admin operations

## Security Model

### Authentication

- Session-based authentication with secure cookies
- bcrypt password hashing (cost factor 12)
- Session tokens stored in D1 with expiration
- CSRF protection via SameSite cookies

### Authorization

- Row-level security via query filters
- Access levels: owner, admin, editor, viewer
- Tree visibility: private, family, public

### Data Protection

- All traffic over HTTPS (Cloudflare enforced)
- Sensitive data encrypted at rest (D1)
- API rate limiting (100 req/min)
- Input sanitization (DOMPurify)

## Performance Optimizations

### Frontend

- React Server Components (RSC)
- Streaming SSR
- Dynamic imports for heavy components
- Image optimization via Cloudflare

### Backend

- Edge execution (low latency)
- Connection pooling (D1)
- Batch queries where possible
- Minimal cold starts

### Database

- Strategic indexes on:
  - persons: tree_id, full_name_ar, birth_date
  - relationships: person1_id, person2_id
  - sessions: token, expires_at
- Query optimization via EXPLAIN ANALYZE

## Internationalization

### Locale Handling

```
/[locale]/...
├── /ar/...  # Arabic (RTL)
└── /en/...  # English (LTR)
```

### Translation Strategy

- Static translations in `src/i18n/messages/`
- Dynamic content stored bilingual (name_ar, name_en)
- RTL-aware CSS with logical properties

## Error Handling

### Error Boundaries

- React Error Boundary at route level
- Graceful degradation for non-critical features
- User-friendly error messages (bilingual)

### Logging

- Structured JSON logs
- Correlation IDs for request tracing
- Severity levels: debug, info, warn, error
- Cloudflare Workers Logs integration

### Monitoring

- Request duration metrics
- Database query performance
- Error rate tracking
- Business metrics (trees created, users registered)

## Deployment

### Environments

| Environment | Purpose | Database |
|------------|---------|----------|
| Development | Local testing | Local D1 |
| Staging | Pre-production | D1 (staging) |
| Production | Live users | D1 (production) |

### CI/CD Pipeline

```
Push → GitHub Actions
  ├── Lint & Type Check
  ├── Unit Tests
  ├── Build
  ├── E2E Tests
  └── Deploy (staging/production)
```

### Rollback Strategy

- Cloudflare Pages deployment history
- Database migrations are forward-only
- Feature flags for gradual rollout

## Future Considerations

### Scalability

- D1 supports horizontal read scaling
- R2 has unlimited object storage
- KV caching reduces DB load

### Feature Roadmap

- Offline-first with service workers
- Real-time collaboration (Durable Objects)
- DNA/genetic data integration
- Document scanning and OCR
