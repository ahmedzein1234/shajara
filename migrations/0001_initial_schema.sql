-- Initial schema for Shajara Arabic Family Tree Application
-- Designed for Cloudflare D1 database
-- Supports Arabic naming conventions with patronymic chains

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    locale TEXT NOT NULL DEFAULT 'ar', -- 'ar' for Arabic, 'en' for English
    created_at INTEGER NOT NULL DEFAULT (unixepoch()), -- Unix timestamp
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- TREES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trees (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    user_id TEXT NOT NULL, -- Owner of the tree
    name TEXT NOT NULL, -- Tree name (can be in Arabic or English)
    description TEXT,
    is_public INTEGER NOT NULL DEFAULT 0, -- 0 = private, 1 = public (SQLite uses INTEGER for boolean)
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_trees_user_id ON trees(user_id);
CREATE INDEX idx_trees_is_public ON trees(is_public);
CREATE INDEX idx_trees_created_at ON trees(created_at);

-- =====================================================
-- PERSONS TABLE (Core table for family members)
-- Designed specifically for Arabic naming conventions
-- =====================================================
CREATE TABLE IF NOT EXISTS persons (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    tree_id TEXT NOT NULL,

    -- Arabic name components
    given_name TEXT NOT NULL, -- الاسم الأول (e.g., "محمد" or "فاطمة")
    patronymic_chain TEXT, -- سلسلة النسب (e.g., "بن خالد بن محمد بن عبدالله")
    family_name TEXT, -- اسم العائلة/القبيلة (e.g., "القحطاني" or "آل سعود")

    -- Full names (computed/stored for performance)
    full_name_ar TEXT, -- Full Arabic name: "محمد بن خالد بن محمد القحطاني"
    full_name_en TEXT, -- English transliteration: "Mohammed bin Khaled bin Mohammed Al-Qahtani"

    -- Basic information
    gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),

    -- Birth information
    birth_date TEXT, -- ISO 8601 date format or Hijri date string
    birth_place TEXT, -- Place name in Arabic/English
    birth_place_lat REAL, -- Latitude for map display
    birth_place_lng REAL, -- Longitude for map display

    -- Death information
    death_date TEXT, -- ISO 8601 date format or Hijri date string
    death_place TEXT,
    death_place_lat REAL,
    death_place_lng REAL,
    is_living INTEGER NOT NULL DEFAULT 1, -- 0 = deceased, 1 = living

    -- Media and notes
    photo_url TEXT, -- Profile photo URL (from R2 storage)
    notes TEXT, -- Additional notes about the person

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_persons_tree_id ON persons(tree_id);
CREATE INDEX idx_persons_given_name ON persons(given_name);
CREATE INDEX idx_persons_family_name ON persons(family_name);
CREATE INDEX idx_persons_full_name_ar ON persons(full_name_ar);
CREATE INDEX idx_persons_full_name_en ON persons(full_name_en);
CREATE INDEX idx_persons_gender ON persons(gender);
CREATE INDEX idx_persons_is_living ON persons(is_living);
CREATE INDEX idx_persons_birth_date ON persons(birth_date);
CREATE INDEX idx_persons_created_at ON persons(created_at);

-- Full-text search index for names (D1 supports FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS persons_fts USING fts5(
    person_id UNINDEXED,
    given_name,
    patronymic_chain,
    family_name,
    full_name_ar,
    full_name_en,
    content=persons,
    content_rowid=rowid
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS persons_fts_insert AFTER INSERT ON persons BEGIN
    INSERT INTO persons_fts(person_id, given_name, patronymic_chain, family_name, full_name_ar, full_name_en)
    VALUES (new.id, new.given_name, new.patronymic_chain, new.family_name, new.full_name_ar, new.full_name_en);
END;

CREATE TRIGGER IF NOT EXISTS persons_fts_delete AFTER DELETE ON persons BEGIN
    DELETE FROM persons_fts WHERE person_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS persons_fts_update AFTER UPDATE ON persons BEGIN
    DELETE FROM persons_fts WHERE person_id = old.id;
    INSERT INTO persons_fts(person_id, given_name, patronymic_chain, family_name, full_name_ar, full_name_en)
    VALUES (new.id, new.given_name, new.patronymic_chain, new.family_name, new.full_name_ar, new.full_name_en);
END;

-- =====================================================
-- RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    tree_id TEXT NOT NULL,
    person1_id TEXT NOT NULL, -- First person in the relationship
    person2_id TEXT NOT NULL, -- Second person in the relationship
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('parent', 'spouse', 'sibling')),

    -- Marriage-specific fields (only for spouse relationships)
    marriage_date TEXT, -- ISO 8601 or Hijri date
    marriage_place TEXT,
    divorce_date TEXT,
    divorce_place TEXT,

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE,

    -- Ensure no duplicate relationships (bidirectional uniqueness)
    UNIQUE(person1_id, person2_id, relationship_type)
);

CREATE INDEX idx_relationships_tree_id ON relationships(tree_id);
CREATE INDEX idx_relationships_person1_id ON relationships(person1_id);
CREATE INDEX idx_relationships_person2_id ON relationships(person2_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_created_at ON relationships(created_at);

-- Composite index for finding all relationships for a person
CREATE INDEX idx_relationships_persons ON relationships(person1_id, person2_id);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    person_id TEXT NOT NULL,
    tree_id TEXT NOT NULL,

    -- Event details
    event_type TEXT NOT NULL, -- birth, death, marriage, migration, hajj, graduation, etc.
    event_date TEXT, -- ISO 8601 or Hijri date

    -- Location information
    place_name TEXT,
    latitude REAL,
    longitude REAL,

    -- Additional details
    description TEXT, -- Detailed description of the event

    -- Metadata
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_person_id ON events(person_id);
CREATE INDEX idx_events_tree_id ON events(tree_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_at ON events(created_at);

-- =====================================================
-- MEDIA TABLE (for R2 storage references)
-- =====================================================
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    tree_id TEXT NOT NULL,

    -- R2 storage information
    r2_key TEXT NOT NULL UNIQUE, -- R2 object key
    url TEXT NOT NULL, -- Public URL to access the media
    file_type TEXT NOT NULL, -- MIME type (image/jpeg, video/mp4, etc.)
    file_size INTEGER NOT NULL, -- Size in bytes

    -- Media metadata
    title TEXT,
    description TEXT,

    -- Upload information
    uploaded_by TEXT NOT NULL, -- User ID who uploaded
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_media_tree_id ON media(tree_id);
CREATE INDEX idx_media_r2_key ON media(r2_key);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_file_type ON media(file_type);
CREATE INDEX idx_media_created_at ON media(created_at);

-- =====================================================
-- PERSON_MEDIA TABLE (junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS person_media (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    person_id TEXT NOT NULL,
    media_id TEXT NOT NULL,

    -- Relationship metadata
    caption TEXT, -- Caption specific to this person
    display_order INTEGER DEFAULT 0, -- Order for displaying multiple media items
    is_primary INTEGER NOT NULL DEFAULT 0, -- Is this the primary photo for the person?

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,

    UNIQUE(person_id, media_id)
);

CREATE INDEX idx_person_media_person_id ON person_media(person_id);
CREATE INDEX idx_person_media_media_id ON person_media(media_id);
CREATE INDEX idx_person_media_is_primary ON person_media(is_primary);
CREATE INDEX idx_person_media_display_order ON person_media(display_order);

-- =====================================================
-- TREE COLLABORATORS TABLE (for shared trees)
-- =====================================================
CREATE TABLE IF NOT EXISTS tree_collaborators (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
    invited_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE(tree_id, user_id)
);

CREATE INDEX idx_tree_collaborators_tree_id ON tree_collaborators(tree_id);
CREATE INDEX idx_tree_collaborators_user_id ON tree_collaborators(user_id);

-- =====================================================
-- AUDIT LOG TABLE (optional, for tracking changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tree_id TEXT,
    entity_type TEXT NOT NULL, -- 'person', 'relationship', 'event', etc.
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    changes TEXT, -- JSON string of what changed
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_tree_id ON audit_log(tree_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
