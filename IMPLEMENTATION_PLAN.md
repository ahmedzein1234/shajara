# Shajara Implementation Plan

## Executive Summary

Based on comprehensive assessment by 6 specialized research agents, this plan transforms Shajara from an MVP into a market-leading Arabic-first family tree platform. The $6.6B genealogy market has zero Arabic-native competitors, presenting a significant opportunity.

**Current State:** Live at https://shajara-64n.pages.dev with D1 database and R2 storage
**Target:** Full-featured platform with 100K users and $17.4M ARR by Year 5

---

## Phase 1: Foundation (Weeks 1-6)

### 1.1 Authentication System (Week 1-2)
**Priority: CRITICAL** - Currently using mock user IDs

#### Database Schema Additions
```sql
-- Add to migrations/0002_auth.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  locale TEXT DEFAULT 'ar',
  auth_provider TEXT DEFAULT 'email', -- email, google, apple
  provider_id TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

#### Implementation Tasks
- [ ] Install `@auth/core` and `@auth/d1-adapter`
- [ ] Create `/api/auth/[...nextauth]/route.ts` with edge runtime
- [ ] Add Google OAuth provider (primary for Arabic users)
- [ ] Add Apple Sign-In (iOS requirement)
- [ ] Add email/password with Arabic validation
- [ ] Create login/register pages in Arabic
- [ ] Add session middleware to protect routes
- [ ] Update all mock `userId` references

#### Files to Create/Modify
```
src/
├── lib/
│   └── auth/
│       ├── config.ts         # Auth.js configuration
│       ├── providers.ts      # OAuth providers
│       └── middleware.ts     # Session validation
├── app/
│   ├── [locale]/
│   │   ├── login/page.tsx    # Login page
│   │   ├── register/page.tsx # Registration page
│   │   └── profile/page.tsx  # User profile
│   └── api/
│       └── auth/
│           └── [...nextauth]/route.ts
└── components/
    └── auth/
        ├── LoginForm.tsx
        ├── RegisterForm.tsx
        └── SocialButtons.tsx
```

### 1.2 Mobile Navigation Fix (Week 2)
**Priority: HIGH** - Currently non-functional

#### Tasks
- [ ] Fix hamburger menu click handler in `Header.tsx`
- [ ] Add mobile slide-out drawer with RTL animation
- [ ] Implement touch-friendly 44px tap targets
- [ ] Add swipe-to-close gesture
- [ ] Test on iOS Safari and Android Chrome

#### Component Changes
```typescript
// src/components/layout/MobileMenu.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileMenu({ isOpen, onClose }: Props) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            className="fixed top-0 right-0 h-full w-80 bg-white z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Menu content */}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 1.3 Person Management Forms (Week 3-4)
**Priority: HIGH** - Core CRUD missing

#### Database Schema
```sql
-- Already exists, but add indexes
CREATE INDEX idx_persons_tree ON persons(tree_id);
CREATE INDEX idx_persons_name ON persons(first_name, last_name);

-- Add FTS5 for Arabic name search
CREATE VIRTUAL TABLE persons_fts USING fts5(
  first_name, last_name, maiden_name,
  content='persons',
  content_rowid='rowid',
  tokenize='unicode61'
);
```

#### Implementation Tasks
- [ ] Create `PersonForm.tsx` component with Arabic labels
- [ ] Add date picker with Hijri/Gregorian toggle
- [ ] Implement photo upload to R2 bucket
- [ ] Add Arabic name transliteration helper
- [ ] Create relationship selector modal
- [ ] Add form validation with Arabic error messages
- [ ] Implement optimistic updates

#### Files to Create
```
src/components/forms/
├── PersonForm.tsx           # Main form component
├── DatePicker.tsx           # Dual calendar picker
├── PhotoUpload.tsx          # R2 integration
├── RelationshipSelect.tsx   # Parent/spouse selector
└── NameTransliterator.tsx   # Arabic ↔ Latin helper
```

### 1.4 Relationship Management (Week 4-5)
**Priority: HIGH**

#### Implementation Tasks
- [ ] Create relationship creation modal
- [ ] Add visual relationship editor in tree view
- [ ] Implement drag-and-drop connection
- [ ] Add relationship type selector (parent, spouse, sibling)
- [ ] Create relationship validation (no circular refs)
- [ ] Add divorce/remarriage support

### 1.5 Hijri Calendar Integration (Week 5)
**Priority: MEDIUM** - Cultural requirement

#### Implementation Tasks
- [ ] Install `@internationalized/date` for Hijri support
- [ ] Create dual date display component
- [ ] Add Hijri date picker
- [ ] Store both Hijri and Gregorian in database
- [ ] Add Islamic holidays awareness

### 1.6 Referral Program (Week 6)
**Priority: HIGH** - Growth driver

#### Database Schema
```sql
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id),
  referred_id TEXT REFERENCES users(id),
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, rewarded
  reward_type TEXT, -- premium_month, storage_bonus
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
```

#### Implementation Tasks
- [ ] Generate unique referral codes per user
- [ ] Create shareable referral link generator
- [ ] Add WhatsApp sharing integration (primary channel)
- [ ] Implement reward fulfillment system
- [ ] Create referral dashboard in profile

---

## Phase 2: Growth Features (Weeks 7-16)

### 2.1 Tribal Lineage System (Week 7-9)
**Priority: HIGH** - Key differentiator for Arab market

#### Database Schema
```sql
CREATE TABLE tribes (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  region TEXT,
  country TEXT,
  description_ar TEXT,
  description_en TEXT,
  coat_of_arms_url TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE tribal_lineages (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id),
  tribe_id TEXT NOT NULL REFERENCES tribes(id),
  lineage_type TEXT, -- direct, marriage, claimed
  verified INTEGER DEFAULT 0,
  verified_by TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE tribal_elders (
  id TEXT PRIMARY KEY,
  tribe_id TEXT NOT NULL REFERENCES tribes(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT, -- elder, historian, moderator
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_tribal_lineages_tree ON tribal_lineages(tree_id);
CREATE INDEX idx_tribal_lineages_tribe ON tribal_lineages(tribe_id);
```

#### Implementation Tasks
- [ ] Create tribe database with major Arab tribes
- [ ] Build tribe search and selection UI
- [ ] Add lineage claim system
- [ ] Implement elder verification workflow
- [ ] Create tribe-specific tree views
- [ ] Add inter-family connection discovery

### 2.2 Mobile PWA Enhancement (Week 9-11)
**Priority: HIGH**

#### Implementation Tasks
- [ ] Add service worker with offline support
- [ ] Implement IndexedDB for offline data
- [ ] Create sync queue for offline changes
- [ ] Add push notifications (Cloudflare Workers)
- [ ] Optimize for Core Web Vitals
- [ ] Add "Add to Home Screen" prompt
- [ ] Create app-like navigation gestures

#### Files to Create
```
public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker
└── icons/                   # App icons (all sizes)

src/lib/
├── offline/
│   ├── db.ts               # IndexedDB wrapper
│   ├── sync.ts             # Sync queue
│   └── storage.ts          # Offline storage
```

### 2.3 Family Invitations (Week 11-12)
**Priority: MEDIUM**

#### Database Schema
```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id),
  inviter_id TEXT NOT NULL REFERENCES users(id),
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'viewer', -- viewer, editor, admin
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT
);

CREATE TABLE tree_members (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'viewer',
  invited_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tree_id, user_id)
);
```

#### Implementation Tasks
- [ ] Create invitation link generator
- [ ] Add WhatsApp/SMS invitation sending
- [ ] Build invitation acceptance flow
- [ ] Implement role-based permissions
- [ ] Add real-time collaboration indicators
- [ ] Create activity feed for changes

### 2.4 Voice-to-Text for Arabic (Week 12-13)
**Priority: MEDIUM** - Accessibility and ease of use

#### Implementation Tasks
- [ ] Integrate Web Speech API for Arabic
- [ ] Add voice input to all text fields
- [ ] Implement Arabic dialect detection
- [ ] Create voice command shortcuts
- [ ] Add audio recording for stories

### 2.5 AI-Powered Suggestions (Week 14-16)
**Priority: MEDIUM**

#### Implementation Tasks
- [ ] Integrate Cloudflare Workers AI
- [ ] Add name spelling suggestions
- [ ] Implement relationship inference
- [ ] Create duplicate detection
- [ ] Add smart date estimation
- [ ] Build family story generation

---

## Phase 3: Advanced Features (Weeks 17-30)

### 3.1 DNA Integration (Week 17-22)
**Priority: MEDIUM** - Market differentiator

#### Implementation Tasks
- [ ] Research DNA service APIs (23andMe, AncestryDNA)
- [ ] Build OAuth connection flow
- [ ] Create DNA match visualization
- [ ] Implement haplogroup display
- [ ] Add ethnicity breakdown charts
- [ ] Build match suggestions for trees

### 3.2 Native Mobile Apps (Week 20-26)
**Priority: MEDIUM**

#### Technology Choice: React Native
- Share component logic with web
- Native performance for tree rendering
- Access to device features (camera, contacts)

#### Implementation Tasks
- [ ] Set up React Native project
- [ ] Create shared component library
- [ ] Build native tree visualization
- [ ] Implement offline-first architecture
- [ ] Add camera integration for photos
- [ ] Create contact import feature
- [ ] Submit to App Store and Play Store

### 3.3 Historical Records Integration (Week 24-28)
**Priority: LOW**

#### Implementation Tasks
- [ ] Partner with Arab archive organizations
- [ ] Build document upload and OCR
- [ ] Create historical record matching
- [ ] Add Ottoman/Mandatory Palestine records
- [ ] Implement newspaper clipping integration

### 3.4 Face Recognition (Week 26-30)
**Priority: LOW**

#### Implementation Tasks
- [ ] Integrate Cloudflare Workers AI for faces
- [ ] Build photo tagging suggestions
- [ ] Create face similarity matching
- [ ] Add privacy controls
- [ ] Implement opt-out mechanism

---

## Monetization Implementation

### Subscription Tiers

#### Free Tier
- 1 family tree
- 50 people limit
- 100MB photo storage
- Basic tree visualization
- Community features

#### Premium ($4.99/month, $39.99/year)
- Unlimited trees
- Unlimited people
- 10GB photo storage
- Tribal lineage claims
- DNA integration
- Priority support
- Export to PDF/GEDCOM

#### Family Plan ($9.99/month)
- All Premium features
- Up to 10 family members
- Shared storage pool (50GB)
- Real-time collaboration
- Private video calls

### Regional Pricing (PPP Adjustment)
| Region | Premium Monthly | Premium Yearly |
|--------|-----------------|----------------|
| GCC (UAE, Saudi, Qatar) | $4.99 | $39.99 |
| Egypt, Morocco, Tunisia | $1.99 | $15.99 |
| Jordan, Lebanon, Iraq | $2.99 | $23.99 |
| Europe/Americas | $6.99 | $55.99 |

### Implementation Tasks
- [ ] Integrate Stripe with regional pricing
- [ ] Add Stripe Elements with Arabic UI
- [ ] Implement subscription management
- [ ] Create usage tracking for limits
- [ ] Build upgrade prompts
- [ ] Add payment method management

---

## Technical Infrastructure

### Performance Optimization
- [ ] Implement tree virtualization for large families
- [ ] Add image lazy loading with blur placeholders
- [ ] Create API response caching
- [ ] Optimize Arabic font loading
- [ ] Add CDN for static assets

### Database Optimization
- [ ] Add read replicas for heavy queries
- [ ] Implement query result caching
- [ ] Create materialized views for stats
- [ ] Add connection pooling

### Monitoring & Analytics
- [ ] Set up Cloudflare Analytics
- [ ] Add error tracking (Sentry)
- [ ] Create user behavior tracking
- [ ] Build admin dashboard
- [ ] Implement A/B testing framework

---

## Testing Strategy

### Unit Tests
- [ ] Component tests with React Testing Library
- [ ] API route tests
- [ ] Database action tests
- [ ] Utility function tests

### Integration Tests
- [ ] Auth flow tests
- [ ] Tree CRUD tests
- [ ] Person/relationship tests
- [ ] Payment flow tests

### E2E Tests
- [ ] Critical user journeys
- [ ] Arabic input handling
- [ ] Mobile responsive behavior
- [ ] Cross-browser compatibility

### Accessibility Tests
- [ ] Screen reader testing (Arabic)
- [ ] Keyboard navigation
- [ ] Color contrast validation
- [ ] Focus management

---

## Launch Checklist

### Pre-Launch
- [ ] Security audit
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Legal review (privacy policy, terms)
- [ ] Arabic copywriting review
- [ ] Beta tester feedback

### Launch
- [ ] DNS configuration
- [ ] SSL certificates
- [ ] CDN setup
- [ ] Monitoring alerts
- [ ] Backup verification
- [ ] Support channels ready

### Post-Launch
- [ ] Monitor error rates
- [ ] Track conversion metrics
- [ ] Gather user feedback
- [ ] Iterate based on data

---

## Success Metrics

### Phase 1 (Week 6)
- Authentication working with 0 auth errors
- Mobile menu functional on all devices
- Person CRUD complete
- 100+ beta signups

### Phase 2 (Week 16)
- 1,000 registered users
- 500 active family trees
- 10% premium conversion
- 4.5+ app store rating

### Phase 3 (Week 30)
- 10,000 registered users
- 5,000 active trees
- 15% premium conversion
- DNA integration live
- Mobile apps launched

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low adoption | Focus on referral program, WhatsApp viral loops |
| Performance issues | Virtualization, caching, edge deployment |
| Data loss | Daily backups, point-in-time recovery |
| Security breach | Auth best practices, regular audits |
| Competition | Speed to market, Arabic-first quality |

---

## Budget Estimate

### Development
- Phase 1: $15,000-25,000 (6 weeks)
- Phase 2: $30,000-50,000 (10 weeks)
- Phase 3: $50,000-80,000 (14 weeks)

### Infrastructure (Monthly)
- Cloudflare Pages: Free
- D1 Database: $5-50
- R2 Storage: $15-100
- Workers AI: $10-50
- Total: $30-200/month

### Marketing (Year 1)
- Social media ads: $10,000
- Influencer partnerships: $5,000
- Content creation: $5,000
- Total: $20,000

---

*Plan created: December 25, 2025*
*Last updated: December 25, 2025*
