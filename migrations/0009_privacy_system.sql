-- =====================================================
-- SHAJARA PRIVACY SYSTEM
-- Implements tiered visibility, connection requests,
-- and member-controlled privacy settings
-- =====================================================

-- =====================================================
-- 1. TREE PRIVACY SETTINGS
-- Default privacy settings for each tree
-- =====================================================
CREATE TABLE IF NOT EXISTS tree_privacy_settings (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL UNIQUE,

    -- Default visibility level for new members
    -- 'private' = owner only
    -- 'family' = verified family members only
    -- 'extended' = extended family (approved connections)
    -- 'public' = anyone can view basic info
    default_visibility TEXT NOT NULL DEFAULT 'family'
        CHECK(default_visibility IN ('private', 'family', 'extended', 'public')),

    -- What's visible to different groups
    show_living_members_to_public INTEGER NOT NULL DEFAULT 0,
    show_photos_to_public INTEGER NOT NULL DEFAULT 0,
    show_dates_to_public INTEGER NOT NULL DEFAULT 0,
    show_locations_to_public INTEGER NOT NULL DEFAULT 0,

    -- Discovery settings
    allow_discovery INTEGER NOT NULL DEFAULT 1, -- Allow tree to be found in search
    require_approval_for_connections INTEGER NOT NULL DEFAULT 1,

    -- Living vs deceased defaults
    living_members_visibility TEXT NOT NULL DEFAULT 'family'
        CHECK(living_members_visibility IN ('private', 'family', 'extended', 'public')),
    deceased_members_visibility TEXT NOT NULL DEFAULT 'extended'
        CHECK(deceased_members_visibility IN ('private', 'family', 'extended', 'public')),

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);

CREATE INDEX idx_tree_privacy_tree_id ON tree_privacy_settings(tree_id);

-- =====================================================
-- 2. MEMBER PRIVACY SETTINGS
-- Individual privacy settings per person in tree
-- Overrides tree defaults when set
-- =====================================================
CREATE TABLE IF NOT EXISTS member_privacy_settings (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL UNIQUE,
    tree_id TEXT NOT NULL,

    -- Who can view this member's full profile
    -- NULL = use tree default
    visibility_level TEXT
        CHECK(visibility_level IN ('private', 'family', 'extended', 'public')),

    -- Field-level visibility overrides (NULL = use tree default)
    show_birth_date INTEGER, -- 0=hide, 1=show, NULL=default
    show_birth_place INTEGER,
    show_death_date INTEGER,
    show_death_place INTEGER,
    show_photo INTEGER,
    show_notes INTEGER,

    -- If this person is a living user, they can control their own profile
    controlled_by_user_id TEXT, -- User who controls this profile (if living & registered)

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (controlled_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_member_privacy_person_id ON member_privacy_settings(person_id);
CREATE INDEX idx_member_privacy_tree_id ON member_privacy_settings(tree_id);
CREATE INDEX idx_member_privacy_controlled_by ON member_privacy_settings(controlled_by_user_id);

-- =====================================================
-- 3. CONNECTION REQUESTS
-- Requests from users wanting to connect with a tree
-- =====================================================
CREATE TABLE IF NOT EXISTS connection_requests (
    id TEXT PRIMARY KEY,

    -- Who is requesting
    requester_user_id TEXT NOT NULL,

    -- What tree they want to connect to
    tree_id TEXT NOT NULL,

    -- Their claimed relationship (optional - for context)
    claimed_relationship TEXT, -- e.g., "I am the grandson of محمد بن عبدالله"
    claimed_person_id TEXT, -- If they identify as a specific person in the tree

    -- Request details
    message TEXT, -- Personal message explaining the connection

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'approved', 'rejected', 'blocked')),

    -- Who reviewed it
    reviewed_by_user_id TEXT,
    reviewed_at INTEGER,
    review_notes TEXT,

    -- After approval, what access level they get
    granted_access_level TEXT
        CHECK(granted_access_level IN ('viewer', 'family', 'trusted', 'editor')),

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_person_id) REFERENCES persons(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(requester_user_id, tree_id) -- One request per user per tree
);

CREATE INDEX idx_connection_requests_requester ON connection_requests(requester_user_id);
CREATE INDEX idx_connection_requests_tree ON connection_requests(tree_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);
CREATE INDEX idx_connection_requests_created_at ON connection_requests(created_at);

-- =====================================================
-- 4. FAMILY CONNECTIONS (Approved relationships)
-- Users who have been approved to access a tree
-- =====================================================
CREATE TABLE IF NOT EXISTS family_connections (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,
    tree_id TEXT NOT NULL,

    -- Their verified relationship to the tree
    linked_person_id TEXT, -- The person in the tree they are linked to (if any)
    relationship_type TEXT, -- 'self', 'direct_descendant', 'relative', 'in_law', 'friend'

    -- Access level
    access_level TEXT NOT NULL DEFAULT 'viewer'
        CHECK(access_level IN ('viewer', 'family', 'trusted', 'editor', 'admin')),

    -- Verification status
    is_verified INTEGER NOT NULL DEFAULT 0, -- 1 = relationship verified by tree admin
    verified_by_user_id TEXT,
    verified_at INTEGER,

    -- Trust chain - who invited/approved them
    invited_by_user_id TEXT,
    connection_request_id TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_person_id) REFERENCES persons(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (connection_request_id) REFERENCES connection_requests(id) ON DELETE SET NULL,

    UNIQUE(user_id, tree_id)
);

CREATE INDEX idx_family_connections_user ON family_connections(user_id);
CREATE INDEX idx_family_connections_tree ON family_connections(tree_id);
CREATE INDEX idx_family_connections_access ON family_connections(access_level);
CREATE INDEX idx_family_connections_verified ON family_connections(is_verified);

-- =====================================================
-- 5. BRANCH ADMINISTRATORS
-- Users who manage specific branches of the tree
-- =====================================================
CREATE TABLE IF NOT EXISTS branch_administrators (
    id TEXT PRIMARY KEY,

    tree_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    -- The root person of the branch they manage
    branch_root_person_id TEXT NOT NULL,

    -- What they can do
    can_add_members INTEGER NOT NULL DEFAULT 1,
    can_edit_members INTEGER NOT NULL DEFAULT 1,
    can_delete_members INTEGER NOT NULL DEFAULT 0,
    can_approve_connections INTEGER NOT NULL DEFAULT 1,
    can_manage_sub_branches INTEGER NOT NULL DEFAULT 0,

    -- Who granted them this role
    granted_by_user_id TEXT NOT NULL,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_root_person_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(tree_id, user_id, branch_root_person_id)
);

CREATE INDEX idx_branch_admins_tree ON branch_administrators(tree_id);
CREATE INDEX idx_branch_admins_user ON branch_administrators(user_id);
CREATE INDEX idx_branch_admins_branch ON branch_administrators(branch_root_person_id);

-- =====================================================
-- 6. BLOCKED USERS
-- Users blocked from accessing specific trees
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_users (
    id TEXT PRIMARY KEY,

    tree_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    blocked_by_user_id TEXT NOT NULL,

    reason TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(tree_id, blocked_user_id)
);

CREATE INDEX idx_blocked_users_tree ON blocked_users(tree_id);
CREATE INDEX idx_blocked_users_user ON blocked_users(blocked_user_id);

-- =====================================================
-- 7. PRIVACY AUDIT LOG
-- Track privacy-related actions for security
-- =====================================================
CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id TEXT PRIMARY KEY,

    tree_id TEXT,
    user_id TEXT NOT NULL,

    action_type TEXT NOT NULL, -- 'view', 'access_request', 'approval', 'rejection', 'block', 'privacy_change'
    target_type TEXT, -- 'tree', 'person', 'connection'
    target_id TEXT,

    details TEXT, -- JSON with additional details

    ip_address TEXT,
    user_agent TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_privacy_audit_tree ON privacy_audit_log(tree_id);
CREATE INDEX idx_privacy_audit_user ON privacy_audit_log(user_id);
CREATE INDEX idx_privacy_audit_action ON privacy_audit_log(action_type);
CREATE INDEX idx_privacy_audit_created ON privacy_audit_log(created_at);

-- =====================================================
-- 8. USER PRIVACY PREFERENCES
-- Global privacy preferences for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS user_privacy_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,

    -- Discoverability
    allow_family_search INTEGER NOT NULL DEFAULT 1, -- Can others find me via family search
    show_in_member_directory INTEGER NOT NULL DEFAULT 1,

    -- Default settings for trees I create
    default_tree_visibility TEXT NOT NULL DEFAULT 'family'
        CHECK(default_tree_visibility IN ('private', 'family', 'extended', 'public')),

    -- Notification preferences for privacy events
    notify_on_connection_request INTEGER NOT NULL DEFAULT 1,
    notify_on_profile_view INTEGER NOT NULL DEFAULT 0,
    notify_on_tree_update INTEGER NOT NULL DEFAULT 1,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_privacy_user ON user_privacy_preferences(user_id);

-- =====================================================
-- Initialize privacy settings for existing trees
-- =====================================================
INSERT OR IGNORE INTO tree_privacy_settings (id, tree_id)
SELECT
    lower(hex(randomblob(16))),
    id
FROM trees
WHERE id NOT IN (SELECT tree_id FROM tree_privacy_settings);
