-- Migration: Arabic Genealogy Features
-- Adds: Hijri dates, expanded name fields (kunya, laqab, nisba), tribal affiliation

-- =====================================================
-- TRIBES TABLE (lookup for tribal affiliations)
-- =====================================================
CREATE TABLE IF NOT EXISTS tribes (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,           -- القحطاني، العتيبي، الدوسري
    name_en TEXT,                    -- English transliteration
    parent_tribe_id TEXT,            -- For sub-tribes (fakhdh)
    origin_type TEXT CHECK(origin_type IN ('qahtani', 'adnani', 'other')), -- قحطانية أو عدنانية
    region TEXT,                     -- Primary region: gulf, levant, maghreb, egypt, etc.
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (parent_tribe_id) REFERENCES tribes(id)
);

CREATE INDEX IF NOT EXISTS idx_tribes_name_ar ON tribes(name_ar);
CREATE INDEX IF NOT EXISTS idx_tribes_name_en ON tribes(name_en);
CREATE INDEX IF NOT EXISTS idx_tribes_parent ON tribes(parent_tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribes_origin ON tribes(origin_type);

-- Insert some common tribes as reference data
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, origin_type, region) VALUES
    ('tribe_qahtani', 'قحطان', 'Qahtan', 'qahtani', 'gulf'),
    ('tribe_otaibi', 'العتيبي', 'Al-Otaibi', 'adnani', 'gulf'),
    ('tribe_dosari', 'الدوسري', 'Al-Dosari', 'qahtani', 'gulf'),
    ('tribe_mutairi', 'المطيري', 'Al-Mutairi', 'adnani', 'gulf'),
    ('tribe_harbi', 'الحربي', 'Al-Harbi', 'adnani', 'gulf'),
    ('tribe_shammar', 'شمر', 'Shammar', 'adnani', 'gulf'),
    ('tribe_anazi', 'العنزي', 'Al-Anazi', 'adnani', 'gulf'),
    ('tribe_tamimi', 'التميمي', 'Al-Tamimi', 'adnani', 'gulf'),
    ('tribe_hashimi', 'الهاشمي', 'Al-Hashimi', 'adnani', 'levant'),
    ('tribe_qurashi', 'القرشي', 'Al-Qurashi', 'adnani', 'gulf');

-- =====================================================
-- ALTER PERSONS TABLE - Add Arabic Genealogy Fields
-- =====================================================

-- Expanded Arabic name components
ALTER TABLE persons ADD COLUMN kunya TEXT;              -- الكنية (Abu/Umm + child's name) e.g., أبو محمد
ALTER TABLE persons ADD COLUMN laqab TEXT;              -- اللقب (title/epithet) e.g., الفاروق، الأمين
ALTER TABLE persons ADD COLUMN nisba TEXT;              -- النسبة (origin) e.g., الدمشقي، المصري، البغدادي

-- Tribal affiliation
ALTER TABLE persons ADD COLUMN tribe_id TEXT REFERENCES tribes(id);
ALTER TABLE persons ADD COLUMN tribal_branch TEXT;      -- فخذ (sub-tribe/clan)
ALTER TABLE persons ADD COLUMN tribal_verified INTEGER DEFAULT 0; -- Is tribal lineage verified?

-- Explicit Hijri date storage (for display and search)
ALTER TABLE persons ADD COLUMN birth_date_hijri TEXT;   -- Format: YYYY-MM-DD in Hijri
ALTER TABLE persons ADD COLUMN death_date_hijri TEXT;   -- Format: YYYY-MM-DD in Hijri

-- Auto-generated nasab chain (cached for performance)
ALTER TABLE persons ADD COLUMN nasab_chain TEXT;        -- Full patronymic chain: محمد بن أحمد بن علي
ALTER TABLE persons ADD COLUMN nasab_chain_en TEXT;     -- English: Muhammad ibn Ahmad ibn Ali

-- Sayyid/Sharif lineage tracking
ALTER TABLE persons ADD COLUMN is_sayyid INTEGER DEFAULT 0;  -- Claims descent from Prophet Muhammad
ALTER TABLE persons ADD COLUMN sayyid_verified INTEGER DEFAULT 0; -- Is Sayyid claim verified?
ALTER TABLE persons ADD COLUMN sayyid_lineage TEXT;     -- Documentation of Sayyid lineage chain

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_persons_kunya ON persons(kunya);
CREATE INDEX IF NOT EXISTS idx_persons_laqab ON persons(laqab);
CREATE INDEX IF NOT EXISTS idx_persons_nisba ON persons(nisba);
CREATE INDEX IF NOT EXISTS idx_persons_tribe_id ON persons(tribe_id);
CREATE INDEX IF NOT EXISTS idx_persons_birth_hijri ON persons(birth_date_hijri);
CREATE INDEX IF NOT EXISTS idx_persons_is_sayyid ON persons(is_sayyid);

-- =====================================================
-- ALTER RELATIONSHIPS TABLE - Add Hijri marriage dates
-- =====================================================

ALTER TABLE relationships ADD COLUMN marriage_date_hijri TEXT;
ALTER TABLE relationships ADD COLUMN divorce_date_hijri TEXT;

-- =====================================================
-- ALTER EVENTS TABLE - Add Hijri event dates
-- =====================================================

ALTER TABLE events ADD COLUMN event_date_hijri TEXT;

-- =====================================================
-- GEDCOM IMPORTS TABLE (track import history)
-- =====================================================
CREATE TABLE IF NOT EXISTS gedcom_imports (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER,
    persons_imported INTEGER DEFAULT 0,
    relationships_imported INTEGER DEFAULT 0,
    errors TEXT,                    -- JSON array of error messages
    warnings TEXT,                  -- JSON array of warning messages
    status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'completed',
    import_date INTEGER NOT NULL DEFAULT (unixepoch()),  -- When import was performed
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_gedcom_imports_tree ON gedcom_imports(tree_id);
CREATE INDEX IF NOT EXISTS idx_gedcom_imports_user ON gedcom_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_gedcom_imports_status ON gedcom_imports(status);

-- =====================================================
-- Update FTS index to include new name fields
-- =====================================================

-- Drop old FTS triggers
DROP TRIGGER IF EXISTS persons_fts_insert;
DROP TRIGGER IF EXISTS persons_fts_delete;
DROP TRIGGER IF EXISTS persons_fts_update;

-- Drop old FTS table
DROP TABLE IF EXISTS persons_fts;

-- Create new FTS table with expanded fields
CREATE VIRTUAL TABLE IF NOT EXISTS persons_fts USING fts5(
    person_id UNINDEXED,
    given_name,
    patronymic_chain,
    family_name,
    full_name_ar,
    full_name_en,
    kunya,
    laqab,
    nisba,
    nasab_chain,
    content=persons,
    content_rowid=rowid
);

-- Recreate triggers with new fields
CREATE TRIGGER IF NOT EXISTS persons_fts_insert AFTER INSERT ON persons BEGIN
    INSERT INTO persons_fts(person_id, given_name, patronymic_chain, family_name, full_name_ar, full_name_en, kunya, laqab, nisba, nasab_chain)
    VALUES (new.id, new.given_name, new.patronymic_chain, new.family_name, new.full_name_ar, new.full_name_en, new.kunya, new.laqab, new.nisba, new.nasab_chain);
END;

CREATE TRIGGER IF NOT EXISTS persons_fts_delete AFTER DELETE ON persons BEGIN
    DELETE FROM persons_fts WHERE person_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS persons_fts_update AFTER UPDATE ON persons BEGIN
    DELETE FROM persons_fts WHERE person_id = old.id;
    INSERT INTO persons_fts(person_id, given_name, patronymic_chain, family_name, full_name_ar, full_name_en, kunya, laqab, nisba, nasab_chain)
    VALUES (new.id, new.given_name, new.patronymic_chain, new.family_name, new.full_name_ar, new.full_name_en, new.kunya, new.laqab, new.nisba, new.nasab_chain);
END;
