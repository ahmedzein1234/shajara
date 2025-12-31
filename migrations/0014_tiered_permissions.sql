-- Migration: Tiered Permissions System
-- Updates tree_collaborators to support: Owner > Manager > Member > Guest

-- Note: SQLite doesn't support modifying CHECK constraints directly
-- We need to recreate the table with the new constraint

-- Step 1: Create new table with updated roles
CREATE TABLE tree_collaborators_new (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'manager', 'member', 'guest')),
    invited_by TEXT,
    invited_at INTEGER NOT NULL DEFAULT (unixepoch()),
    accepted_at INTEGER,

    -- Permissions override (NULL means use default role permissions)
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

-- Step 2: Migrate existing data (convert 'editor' to 'manager', 'viewer' to 'member')
INSERT INTO tree_collaborators_new (id, tree_id, user_id, role, invited_at)
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

-- Step 3: Drop old table and rename new
DROP TABLE tree_collaborators;
ALTER TABLE tree_collaborators_new RENAME TO tree_collaborators;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_tree ON tree_collaborators(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_user ON tree_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_collaborators_role ON tree_collaborators(role);

-- =====================================================
-- EDIT PROPOSALS TABLE (for Family Council feature)
-- =====================================================
CREATE TABLE IF NOT EXISTS edit_proposals (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    proposer_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('person', 'relationship', 'event')),
    entity_id TEXT,                    -- NULL for new entities
    action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
    proposed_changes TEXT,             -- JSON of proposed changes
    reason TEXT,                        -- Why this change is proposed
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
-- PROPOSAL VOTES TABLE
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
-- TREE SETTINGS TABLE (for Family Council config)
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
