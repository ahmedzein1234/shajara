-- Migration: Engagement Features (Phase 2)
-- Privacy controls, contribution requests, activity feed

-- =====================================================
-- PRIVACY SETTINGS
-- =====================================================

-- Tree-level privacy settings
CREATE TABLE IF NOT EXISTS tree_privacy_settings (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- Visibility levels
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'public')),

  -- Living person defaults
  show_living_birth_date TEXT DEFAULT 'year_only' CHECK (show_living_birth_date IN ('full', 'year_only', 'hidden')),
  show_living_birth_place TEXT DEFAULT 'country_only' CHECK (show_living_birth_place IN ('full', 'country_only', 'hidden')),
  show_living_photos INTEGER DEFAULT 1,
  show_living_contact INTEGER DEFAULT 0,

  -- Guest view settings
  allow_guest_view INTEGER DEFAULT 0,
  guest_blur_photos INTEGER DEFAULT 1,
  guest_hide_living INTEGER DEFAULT 1,

  -- Export controls
  allow_gedcom_export INTEGER DEFAULT 1,
  allow_pdf_export INTEGER DEFAULT 1,
  require_approval_for_export INTEGER DEFAULT 0,

  -- Contribution settings
  allow_family_contributions INTEGER DEFAULT 1,
  require_approval_for_contributions INTEGER DEFAULT 1,

  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(tree_id)
);

-- Person-level privacy overrides
CREATE TABLE IF NOT EXISTS person_privacy_overrides (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- Override settings (NULL means use tree defaults)
  show_birth_date TEXT CHECK (show_birth_date IN ('full', 'year_only', 'hidden')),
  show_birth_place TEXT CHECK (show_birth_place IN ('full', 'country_only', 'hidden')),
  show_death_date TEXT CHECK (show_death_date IN ('full', 'year_only', 'hidden')),
  show_death_place TEXT CHECK (show_death_place IN ('full', 'country_only', 'hidden')),
  show_photo INTEGER,
  show_in_public_tree INTEGER,
  allow_tagging TEXT CHECK (allow_tagging IN ('anyone', 'family', 'none')),

  -- Contact info
  hide_completely INTEGER DEFAULT 0,

  set_by TEXT REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(person_id)
);

-- =====================================================
-- CONTRIBUTION REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS contribution_requests (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES persons(id) ON DELETE CASCADE,

  -- Request type
  request_type TEXT NOT NULL CHECK (request_type IN ('photo', 'info', 'memory', 'relative', 'verification', 'correction')),

  -- Request details
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Specific fields requested (JSON array)
  requested_fields TEXT,

  -- Request status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed', 'expired')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- Tracking
  requested_by TEXT NOT NULL REFERENCES users(id),
  fulfilled_by TEXT REFERENCES users(id),
  fulfilled_at INTEGER,

  -- Sharing
  share_code TEXT UNIQUE,
  is_public INTEGER DEFAULT 0,

  -- Expiration
  expires_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Contribution responses
CREATE TABLE IF NOT EXISTS contribution_responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES contribution_requests(id) ON DELETE CASCADE,

  -- Contributor (can be anonymous)
  contributor_id TEXT REFERENCES users(id),
  contributor_name TEXT,
  contributor_email TEXT,
  contributor_relation TEXT,

  -- Response content
  response_type TEXT NOT NULL CHECK (response_type IN ('photo', 'text', 'audio', 'document', 'correction')),
  content TEXT,
  media_url TEXT,

  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  rejection_reason TEXT,

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- ACTIVITY FEED
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'person_added', 'person_updated', 'person_deleted',
    'photo_added', 'photo_updated',
    'relationship_added', 'relationship_updated',
    'tree_updated', 'tree_shared',
    'member_joined', 'member_left',
    'contribution_received', 'contribution_approved',
    'milestone_reached', 'memorial_date',
    'verification_requested', 'verification_completed',
    'export_requested', 'comment_added'
  )),

  -- Actor
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT,

  -- Target entity
  target_type TEXT CHECK (target_type IN ('person', 'relationship', 'tree', 'user', 'contribution')),
  target_id TEXT,
  target_name TEXT,
  target_name_ar TEXT,

  -- Activity details (JSON)
  details TEXT,

  -- Visibility
  is_public INTEGER DEFAULT 0,
  visible_to TEXT DEFAULT 'all' CHECK (visible_to IN ('all', 'admins', 'editors', 'owner')),

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- MEMORIAL DATES
-- =====================================================

CREATE TABLE IF NOT EXISTS memorial_reminders (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reminder settings
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('death_anniversary', 'birth_anniversary', 'custom')),
  custom_date TEXT,
  custom_title_ar TEXT,
  custom_title_en TEXT,

  -- Notification preferences
  notify_days_before INTEGER DEFAULT 1,
  notify_via_email INTEGER DEFAULT 1,
  notify_via_push INTEGER DEFAULT 1,

  -- Status
  is_active INTEGER DEFAULT 1,
  last_notified_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tree_privacy_tree ON tree_privacy_settings(tree_id);
CREATE INDEX IF NOT EXISTS idx_person_privacy_person ON person_privacy_overrides(person_id);
CREATE INDEX IF NOT EXISTS idx_person_privacy_tree ON person_privacy_overrides(tree_id);
CREATE INDEX IF NOT EXISTS idx_contribution_requests_tree ON contribution_requests(tree_id);
CREATE INDEX IF NOT EXISTS idx_contribution_requests_person ON contribution_requests(person_id);
CREATE INDEX IF NOT EXISTS idx_contribution_requests_share ON contribution_requests(share_code);
CREATE INDEX IF NOT EXISTS idx_contribution_responses_request ON contribution_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_tree ON activity_feed(tree_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_memorial_reminders_tree ON memorial_reminders(tree_id);
CREATE INDEX IF NOT EXISTS idx_memorial_reminders_person ON memorial_reminders(person_id);
CREATE INDEX IF NOT EXISTS idx_memorial_reminders_user ON memorial_reminders(user_id);
