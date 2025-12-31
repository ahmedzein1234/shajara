-- Migration: Consolidated Tiered Permissions & Tribal Data
-- This applies missing changes from 0014 and adds any missing tribal sub-tribes
-- Safe to run: uses IF NOT EXISTS and handles existing data

-- =====================================================
-- STEP 1: RECREATE TREE_COLLABORATORS WITH NEW ROLES
-- =====================================================

-- Create new table with updated roles and columns
CREATE TABLE IF NOT EXISTS tree_collaborators_new (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'manager', 'member', 'guest')),
    invited_by TEXT,
    invited_at INTEGER NOT NULL DEFAULT (unixepoch()),
    accepted_at INTEGER,

    -- Permission overrides (NULL = use role defaults)
    can_add_persons INTEGER,
    can_edit_persons INTEGER,
    can_delete_persons INTEGER,
    can_add_relationships INTEGER,
    can_invite_others INTEGER,
    can_export INTEGER,
    can_manage_settings INTEGER,

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id),

    UNIQUE(tree_id, user_id)
);

-- Migrate existing data (convert 'editor' to 'manager', 'viewer' to 'member')
INSERT OR IGNORE INTO tree_collaborators_new (id, tree_id, user_id, role, invited_at)
SELECT
    id,
    tree_id,
    user_id,
    CASE role
        WHEN 'owner' THEN 'owner'
        WHEN 'editor' THEN 'manager'
        WHEN 'viewer' THEN 'member'
        ELSE 'guest'
    END,
    invited_at
FROM tree_collaborators;

-- Drop old table and rename new
DROP TABLE IF EXISTS tree_collaborators;
ALTER TABLE tree_collaborators_new RENAME TO tree_collaborators;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_tree ON tree_collaborators(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_user ON tree_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_role ON tree_collaborators(role);

-- =====================================================
-- STEP 2: CREATE EDIT PROPOSALS TABLE (Family Council)
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_proposals (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    proposer_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('person', 'relationship', 'event')),
    entity_id TEXT,                    -- NULL for new entities
    action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
    proposed_changes TEXT,             -- JSON of proposed changes
    reason TEXT,                       -- Why this change is proposed
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',

    -- Voting
    required_approvals INTEGER DEFAULT 1,
    current_approvals INTEGER DEFAULT 0,

    -- Timestamps
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at INTEGER,
    resolved_at INTEGER,
    resolved_by TEXT,

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (proposer_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_edit_proposals_tree ON edit_proposals(tree_id);
CREATE INDEX IF NOT EXISTS idx_edit_proposals_status ON edit_proposals(status);
CREATE INDEX IF NOT EXISTS idx_edit_proposals_proposer ON edit_proposals(proposer_id);

-- =====================================================
-- STEP 3: CREATE PROPOSAL VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS proposal_votes (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    vote TEXT NOT NULL CHECK(vote IN ('approve', 'reject')),
    comment TEXT,
    voted_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (proposal_id) REFERENCES edit_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id),

    UNIQUE(proposal_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_voter ON proposal_votes(voter_id);

-- =====================================================
-- STEP 4: CREATE TREE SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tree_settings (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL UNIQUE,

    -- Family Council settings
    require_approval_for_add INTEGER DEFAULT 0,
    require_approval_for_edit INTEGER DEFAULT 0,
    require_approval_for_delete INTEGER DEFAULT 1,
    min_approvals_required INTEGER DEFAULT 1,
    proposal_expiry_days INTEGER DEFAULT 7,

    -- Privacy settings
    default_person_visibility TEXT CHECK(default_person_visibility IN ('public', 'tree', 'private')) DEFAULT 'tree',
    allow_guest_view INTEGER DEFAULT 0,

    -- Notification settings
    notify_on_proposals INTEGER DEFAULT 1,
    notify_on_new_members INTEGER DEFAULT 1,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tree_settings_tree ON tree_settings(tree_id);

-- =====================================================
-- STEP 5: ADD SUB-TRIBES (فخوذ) TO EXISTING TRIBES
-- Uses tribe-XXX ID format matching existing data
-- =====================================================

-- Ensure origin_type column exists and update main tribes
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-001' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-002' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-003' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-004' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-005' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-006' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-007' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-008' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-009' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'adnani' WHERE id = 'tribe-010' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-011' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-012' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-013' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-014' AND origin_type IS NULL;
UPDATE tribes SET origin_type = 'qahtani' WHERE id = 'tribe-015' AND origin_type IS NULL;

-- Sub-tribes under عتيبة (tribe-005)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-005-01', 'البرقا', 'Al-Barqa', 'tribe-005', 'adnani', 'gulf'),
    ('tribe-005-02', 'الروقة', 'Al-Rawaqa', 'tribe-005', 'adnani', 'gulf'),
    ('tribe-005-03', 'طلحة', 'Talha', 'tribe-005', 'adnani', 'gulf'),
    ('tribe-005-04', 'النفعة', 'Al-Nafaa', 'tribe-005', 'adnani', 'gulf');

-- Sub-tribes under شمر (tribe-004)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-004-01', 'عبدة', 'Abda', 'tribe-004', 'adnani', 'gulf'),
    ('tribe-004-02', 'أسلم', 'Aslam', 'tribe-004', 'adnani', 'gulf'),
    ('tribe-004-03', 'تومان', 'Tuman', 'tribe-004', 'adnani', 'gulf'),
    ('tribe-004-04', 'الصايح', 'Al-Sayeh', 'tribe-004', 'adnani', 'gulf');

-- Sub-tribes under عنزة (tribe-003)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-003-01', 'الرولة', 'Al-Ruwallah', 'tribe-003', 'adnani', 'gulf'),
    ('tribe-003-02', 'الظفير', 'Al-Dhafir', 'tribe-003', 'adnani', 'gulf'),
    ('tribe-003-03', 'العمارات', 'Al-Amarat', 'tribe-003', 'adnani', 'gulf'),
    ('tribe-003-04', 'السبعة', 'Al-Sba', 'tribe-003', 'adnani', 'gulf'),
    ('tribe-003-05', 'الفدعان', 'Al-Fidaan', 'tribe-003', 'adnani', 'gulf');

-- Sub-tribes under مطير (tribe-006)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-006-01', 'عليا', 'Aliya', 'tribe-006', 'adnani', 'gulf'),
    ('tribe-006-02', 'بني عبدالله', 'Banu Abdullah', 'tribe-006', 'adnani', 'gulf'),
    ('tribe-006-03', 'بريه', 'Braih', 'tribe-006', 'adnani', 'gulf'),
    ('tribe-006-04', 'الموهة', 'Al-Muwaha', 'tribe-006', 'adnani', 'gulf');

-- Sub-tribes under حرب (tribe-007)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-007-01', 'بني سالم', 'Banu Salim', 'tribe-007', 'adnani', 'gulf'),
    ('tribe-007-02', 'بني علي', 'Banu Ali', 'tribe-007', 'adnani', 'gulf'),
    ('tribe-007-03', 'مسروح', 'Masruh', 'tribe-007', 'adnani', 'gulf'),
    ('tribe-007-04', 'السفر', 'Al-Safar', 'tribe-007', 'adnani', 'gulf');

-- Sub-tribes under قحطان (tribe-011)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-011-01', 'سنحان', 'Sanhan', 'tribe-011', 'qahtani', 'gulf'),
    ('tribe-011-02', 'رفيدة', 'Rufaida', 'tribe-011', 'qahtani', 'gulf'),
    ('tribe-011-03', 'بني بشر', 'Bani Bishr', 'tribe-011', 'qahtani', 'gulf'),
    ('tribe-011-04', 'الجنب', 'Al-Janb', 'tribe-011', 'qahtani', 'gulf'),
    ('tribe-011-05', 'الحباب', 'Al-Habab', 'tribe-011', 'qahtani', 'gulf');

-- Sub-tribes under الدواسر (tribe-009)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-009-01', 'آل صهابة', 'Al Sahaba', 'tribe-009', 'qahtani', 'gulf'),
    ('tribe-009-02', 'المساكرة', 'Al-Masakir', 'tribe-009', 'qahtani', 'gulf'),
    ('tribe-009-03', 'الرواجح', 'Al-Rawajih', 'tribe-009', 'qahtani', 'gulf'),
    ('tribe-009-04', 'الشياية', 'Al-Shiyaya', 'tribe-009', 'qahtani', 'gulf');

-- Sub-tribes under بني تميم (tribe-008)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-008-01', 'بني سعد', 'Banu Sad', 'tribe-008', 'adnani', 'gulf'),
    ('tribe-008-02', 'بني عمرو', 'Banu Amr', 'tribe-008', 'adnani', 'gulf'),
    ('tribe-008-03', 'بني حنيفة', 'Banu Hanifa', 'tribe-008', 'adnani', 'gulf');

-- Sub-tribes under بني هاشم (tribe-002)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-002-01', 'الحسني (الأشراف)', 'Al-Hasani (Sharif)', 'tribe-002', 'adnani', 'levant'),
    ('tribe-002-02', 'الحسيني (السادة)', 'Al-Husayni (Sayyid)', 'tribe-002', 'adnani', 'levant'),
    ('tribe-002-03', 'العباسي', 'Al-Abbasi', 'tribe-002', 'adnani', 'levant'),
    ('tribe-002-04', 'العلوي', 'Al-Alawi', 'tribe-002', 'adnani', 'levant');

-- Example nested hierarchy: Hamula under Fakhdh (Al-Barqa)
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-005-01-01', 'الذيغثة', 'Al-Dhaghtha', 'tribe-005-01', 'adnani', 'gulf'),
    ('tribe-005-01-02', 'الحزمان', 'Al-Hazman', 'tribe-005-01', 'adnani', 'gulf');

-- Example Bayt level under Hamula
INSERT OR IGNORE INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region) VALUES
    ('tribe-005-01-01-01', 'المواينة', 'Al-Mowanes', 'tribe-005-01-01', 'adnani', 'gulf'),
    ('tribe-005-01-01-02', 'الشذافية', 'Al-Shathafya', 'tribe-005-01-01', 'adnani', 'gulf');
