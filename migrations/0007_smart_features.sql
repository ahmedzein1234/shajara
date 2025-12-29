-- Phase 5: Smart Features - AI Suggestions & Duplicate Detection
-- Migration: 0007_smart_features.sql

-- =====================================================
-- DUPLICATE DETECTION
-- =====================================================

-- Potential duplicate pairs detected by the system
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  member1_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  member2_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  similarity_score REAL NOT NULL DEFAULT 0, -- 0.0 to 1.0
  match_reasons TEXT, -- JSON array of reasons ["name_match", "date_match", "parent_match"]
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed_duplicate, not_duplicate, merged
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(tree_id, member1_id, member2_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_tree ON duplicate_candidates(tree_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_status ON duplicate_candidates(tree_id, status);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_score ON duplicate_candidates(tree_id, similarity_score DESC);

-- Merge history for tracking merged duplicates
CREATE TABLE IF NOT EXISTS merge_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  kept_member_id TEXT NOT NULL, -- The member that was kept
  merged_member_id TEXT NOT NULL, -- The member that was merged into kept_member
  merged_data TEXT, -- JSON snapshot of merged member's data before merge
  field_choices TEXT, -- JSON object of which fields came from which member
  merged_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_merge_history_tree ON merge_history(tree_id);
CREATE INDEX IF NOT EXISTS idx_merge_history_kept ON merge_history(kept_member_id);

-- =====================================================
-- AI SUGGESTIONS
-- =====================================================

-- AI-generated suggestions for improving the tree
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES family_members(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- relationship_hint, missing_info, date_correction, name_suggestion, potential_relative
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  confidence REAL NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  suggestion_data TEXT, -- JSON with specific suggestion details
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, dismissed, expired
  acted_on_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  acted_on_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_tree ON ai_suggestions(tree_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_member ON ai_suggestions(member_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(tree_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(tree_id, suggestion_type);

-- =====================================================
-- DATA QUALITY TRACKING
-- =====================================================

-- Data quality scores per member
CREATE TABLE IF NOT EXISTS member_quality_scores (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  overall_score REAL NOT NULL DEFAULT 0, -- 0-100
  completeness_score REAL NOT NULL DEFAULT 0, -- 0-100
  accuracy_score REAL NOT NULL DEFAULT 0, -- 0-100
  consistency_score REAL NOT NULL DEFAULT 0, -- 0-100
  missing_fields TEXT, -- JSON array of missing field names
  issues TEXT, -- JSON array of detected issues
  last_calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_quality_tree ON member_quality_scores(tree_id);
CREATE INDEX IF NOT EXISTS idx_member_quality_score ON member_quality_scores(tree_id, overall_score);

-- Tree-level quality metrics
CREATE TABLE IF NOT EXISTS tree_quality_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  total_members INTEGER NOT NULL DEFAULT 0,
  members_with_photos INTEGER NOT NULL DEFAULT 0,
  members_with_birth_date INTEGER NOT NULL DEFAULT 0,
  members_with_birth_place INTEGER NOT NULL DEFAULT 0,
  members_with_death_date INTEGER NOT NULL DEFAULT 0,
  members_with_bio INTEGER NOT NULL DEFAULT 0,
  average_completeness REAL NOT NULL DEFAULT 0,
  duplicate_candidates_count INTEGER NOT NULL DEFAULT 0,
  pending_suggestions_count INTEGER NOT NULL DEFAULT 0,
  overall_health_score REAL NOT NULL DEFAULT 0, -- 0-100
  last_calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(tree_id)
);

CREATE INDEX IF NOT EXISTS idx_tree_quality_score ON tree_quality_metrics(overall_health_score);

-- =====================================================
-- NAME PATTERNS & ANALYSIS
-- =====================================================

-- Common name patterns in a tree (for suggestions)
CREATE TABLE IF NOT EXISTS name_patterns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- first_name, family_name, naming_tradition
  pattern_value TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  generation_range TEXT, -- JSON: {"min": 1, "max": 5}
  last_updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(tree_id, pattern_type, pattern_value)
);

CREATE INDEX IF NOT EXISTS idx_name_patterns_tree ON name_patterns(tree_id);
CREATE INDEX IF NOT EXISTS idx_name_patterns_count ON name_patterns(tree_id, occurrence_count DESC);

-- =====================================================
-- SMART SEARCH HISTORY
-- =====================================================

-- Track search patterns for improving suggestions
CREATE TABLE IF NOT EXISTS search_analytics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_result_id TEXT,
  search_type TEXT NOT NULL DEFAULT 'member', -- member, location, date
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_tree ON search_analytics(tree_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user ON search_analytics(user_id);

-- =====================================================
-- RELATIONSHIP ANALYSIS
-- =====================================================

-- Analyzed relationship paths for quick lookup
CREATE TABLE IF NOT EXISTS relationship_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  from_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  to_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_path TEXT, -- JSON array of member IDs in path
  relationship_type_ar TEXT, -- e.g., "ابن عم" (cousin)
  relationship_type_en TEXT, -- e.g., "cousin"
  distance INTEGER NOT NULL DEFAULT 0, -- number of steps
  last_calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(tree_id, from_member_id, to_member_id)
);

CREATE INDEX IF NOT EXISTS idx_relationship_cache_tree ON relationship_cache(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationship_cache_from ON relationship_cache(from_member_id);
CREATE INDEX IF NOT EXISTS idx_relationship_cache_to ON relationship_cache(to_member_id);
