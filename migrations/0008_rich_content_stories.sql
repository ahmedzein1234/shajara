-- Phase 4: Rich Content & Stories
-- Migration: 0008_rich_content_stories.sql

-- =====================================================
-- FAMILY STORIES
-- =====================================================

-- Stories table - rich content stories about family members or events
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Story content
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT, -- Rich text/HTML content
  content_en TEXT,
  excerpt_ar TEXT, -- Short preview
  excerpt_en TEXT,

  -- Cover image
  cover_image_url TEXT,

  -- Story metadata
  story_type TEXT NOT NULL DEFAULT 'memory', -- memory, biography, tradition, recipe, historical, milestone, tribute

  -- Date information (for timeline placement)
  event_date TEXT, -- YYYY-MM-DD or YYYY-MM or YYYY
  event_date_precision TEXT DEFAULT 'day', -- day, month, year, decade, approximate
  event_end_date TEXT, -- For events spanning time

  -- Location
  location_ar TEXT,
  location_en TEXT,
  latitude REAL,
  longitude REAL,

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  visibility TEXT NOT NULL DEFAULT 'family', -- family, public, private
  published_at INTEGER,

  -- Engagement
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,

  -- Featured
  is_featured INTEGER NOT NULL DEFAULT 0,
  featured_order INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_stories_tree ON stories(tree_id);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(tree_id, status);
CREATE INDEX IF NOT EXISTS idx_stories_type ON stories(tree_id, story_type);
CREATE INDEX IF NOT EXISTS idx_stories_date ON stories(tree_id, event_date);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(tree_id, is_featured, featured_order);

-- Story-Member associations (which members are mentioned/featured)
CREATE TABLE IF NOT EXISTS story_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'mentioned', -- primary, mentioned, author_of
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(story_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_story_members_story ON story_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_members_member ON story_members(member_id);

-- Story likes
CREATE TABLE IF NOT EXISTS story_likes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);

-- =====================================================
-- MEDIA ATTACHMENTS
-- =====================================================

-- Media items (photos, audio, video)
CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- File information
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image, audio, video, document
  mime_type TEXT,
  file_size INTEGER, -- in bytes
  file_name TEXT,

  -- For images
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,

  -- For audio/video
  duration INTEGER, -- in seconds

  -- Metadata
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Date information
  taken_at TEXT, -- When the photo/video was taken
  taken_at_precision TEXT DEFAULT 'day',

  -- Location
  location_ar TEXT,
  location_en TEXT,
  latitude REAL,
  longitude REAL,

  -- Processing status
  processing_status TEXT DEFAULT 'completed', -- pending, processing, completed, failed

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_media_items_tree ON media_items(tree_id);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(tree_id, file_type);
CREATE INDEX IF NOT EXISTS idx_media_items_date ON media_items(tree_id, taken_at);

-- Media-Story associations
CREATE TABLE IF NOT EXISTS story_media (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption_ar TEXT,
  caption_en TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(story_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_story_media_story ON story_media(story_id);

-- Media-Member associations
CREATE TABLE IF NOT EXISTS member_media (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  is_profile_photo INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(member_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_member_media_member ON member_media(member_id);

-- =====================================================
-- TIMELINE EVENTS
-- =====================================================

-- Timeline events (auto-generated + manual)
CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- Event source
  source_type TEXT NOT NULL, -- member_birth, member_death, member_marriage, story, manual, milestone
  source_id TEXT, -- ID of the source record (member_id, story_id, etc.)

  -- Event details
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Date
  event_date TEXT NOT NULL, -- YYYY-MM-DD or YYYY-MM or YYYY
  event_date_precision TEXT DEFAULT 'day',
  event_end_date TEXT,

  -- Location
  location_ar TEXT,
  location_en TEXT,
  latitude REAL,
  longitude REAL,

  -- Visual
  icon TEXT, -- Icon name for display
  color TEXT, -- Color code for timeline
  image_url TEXT,

  -- Event type categorization
  event_category TEXT NOT NULL DEFAULT 'life', -- life, marriage, achievement, memorial, historical, custom

  -- Related members
  primary_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,

  -- Visibility
  is_visible INTEGER NOT NULL DEFAULT 1,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_tree ON timeline_events(tree_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(tree_id, event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(tree_id, event_category);
CREATE INDEX IF NOT EXISTS idx_timeline_events_source ON timeline_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_member ON timeline_events(primary_member_id);

-- Timeline event members (for events involving multiple people)
CREATE TABLE IF NOT EXISTS timeline_event_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  event_id TEXT NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant', -- primary, participant, witness
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_timeline_event_members_event ON timeline_event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_members_member ON timeline_event_members(member_id);

-- =====================================================
-- AUDIO RECORDINGS (Voice memories)
-- =====================================================

-- Voice recordings associated with members
CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  recorded_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Recording info
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  file_size INTEGER,

  -- Metadata
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Transcription
  transcription_ar TEXT,
  transcription_en TEXT,
  is_transcribed INTEGER NOT NULL DEFAULT 0,

  -- Recording type
  recording_type TEXT DEFAULT 'memory', -- memory, interview, oral_history, message

  -- Date
  recorded_date TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_tree ON voice_recordings(tree_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_member ON voice_recordings(member_id);

-- =====================================================
-- FAMILY TRADITIONS & RECIPES
-- =====================================================

-- Family traditions
CREATE TABLE IF NOT EXISTS family_traditions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Content
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Tradition details
  tradition_type TEXT DEFAULT 'custom', -- holiday, celebration, food, religious, cultural, custom
  occasion TEXT, -- When this tradition is observed
  frequency TEXT, -- annual, monthly, weekly, occasional

  -- Origin
  origin_story_ar TEXT,
  origin_story_en TEXT,
  started_by_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  started_year TEXT,

  -- Media
  cover_image_url TEXT,

  -- Status
  is_active INTEGER NOT NULL DEFAULT 1,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_family_traditions_tree ON family_traditions(tree_id);
CREATE INDEX IF NOT EXISTS idx_family_traditions_type ON family_traditions(tree_id, tradition_type);

-- Family recipes
CREATE TABLE IF NOT EXISTS family_recipes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Recipe info
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,

  -- Recipe details
  ingredients_ar TEXT, -- JSON array
  ingredients_en TEXT,
  instructions_ar TEXT, -- Rich text
  instructions_en TEXT,

  -- Metadata
  prep_time INTEGER, -- minutes
  cook_time INTEGER, -- minutes
  servings INTEGER,
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard

  -- Categorization
  category TEXT DEFAULT 'main', -- appetizer, main, dessert, beverage, side
  cuisine TEXT, -- Arab, Mediterranean, etc.
  dietary_info TEXT, -- JSON array: halal, vegetarian, vegan, etc.

  -- Origin
  origin_story_ar TEXT,
  origin_story_en TEXT,
  original_chef_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,

  -- Media
  cover_image_url TEXT,

  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_family_recipes_tree ON family_recipes(tree_id);
CREATE INDEX IF NOT EXISTS idx_family_recipes_category ON family_recipes(tree_id, category);

-- Recipe media (step-by-step photos)
CREATE TABLE IF NOT EXISTS recipe_media (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  recipe_id TEXT NOT NULL REFERENCES family_recipes(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  step_number INTEGER, -- NULL for general photos
  caption_ar TEXT,
  caption_en TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_recipe_media_recipe ON recipe_media(recipe_id);
