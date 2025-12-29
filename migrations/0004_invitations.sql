-- Migration: 0004_invitations.sql
-- Family Tree Invitations System
-- Allows tree owners to invite family members to collaborate

-- Tree invitations table
CREATE TABLE IF NOT EXISTS tree_invitations (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_phone TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  accepted_by TEXT REFERENCES users(id),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tree collaborators table (users who have access to a tree)
CREATE TABLE IF NOT EXISTS tree_collaborators (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by TEXT REFERENCES users(id),
  joined_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_accessed_at INTEGER,
  UNIQUE(tree_id, user_id)
);

-- Invitation activity log
CREATE TABLE IF NOT EXISTS invitation_activity (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL REFERENCES tree_invitations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'viewed', 'accepted', 'declined', 'expired', 'resent', 'cancelled')),
  actor_id TEXT REFERENCES users(id),
  metadata TEXT, -- JSON for additional info
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_tree ON tree_invitations(tree_id);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON tree_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON tree_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON tree_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON tree_invitations(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_tree ON tree_collaborators(tree_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON tree_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_activity_invitation ON invitation_activity(invitation_id);
