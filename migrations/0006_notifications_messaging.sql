-- Migration: Notifications & Messaging (Phase 3)
-- Push notifications, email digests, in-app messaging, mentions

-- =====================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  device_name TEXT,
  browser TEXT,
  platform TEXT,

  -- Status
  is_active INTEGER DEFAULT 1,
  last_used_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(user_id, endpoint)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree_id TEXT REFERENCES trees(id) ON DELETE CASCADE,

  -- Notification type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'tree_invite', 'invite_accepted', 'member_joined',
    'person_added', 'person_updated', 'photo_added',
    'contribution_request', 'contribution_received', 'contribution_approved', 'contribution_rejected',
    'memorial_reminder', 'birthday_reminder',
    'mention', 'message', 'comment',
    'export_ready', 'weekly_digest', 'monthly_digest',
    'system'
  )),

  -- Content
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_ar TEXT,
  body_en TEXT,

  -- Action link
  action_url TEXT,

  -- Related entities
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT,
  target_type TEXT CHECK (target_type IN ('person', 'tree', 'contribution', 'message', 'comment')),
  target_id TEXT,

  -- Additional data (JSON)
  metadata TEXT,

  -- Status
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  is_pushed INTEGER DEFAULT 0,
  pushed_at INTEGER,
  is_emailed INTEGER DEFAULT 0,
  emailed_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- NOTIFICATION PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Push notification preferences
  push_enabled INTEGER DEFAULT 1,
  push_tree_updates INTEGER DEFAULT 1,
  push_contributions INTEGER DEFAULT 1,
  push_messages INTEGER DEFAULT 1,
  push_mentions INTEGER DEFAULT 1,
  push_memorials INTEGER DEFAULT 1,

  -- Email preferences
  email_enabled INTEGER DEFAULT 1,
  email_tree_updates INTEGER DEFAULT 1,
  email_contributions INTEGER DEFAULT 1,
  email_messages INTEGER DEFAULT 0,
  email_mentions INTEGER DEFAULT 1,
  email_memorials INTEGER DEFAULT 1,

  -- Digest preferences
  digest_frequency TEXT DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  digest_day INTEGER DEFAULT 0, -- 0=Sunday for weekly, 1-28 for monthly

  -- Quiet hours (24h format)
  quiet_hours_enabled INTEGER DEFAULT 0,
  quiet_hours_start INTEGER DEFAULT 22, -- 10 PM
  quiet_hours_end INTEGER DEFAULT 8, -- 8 AM

  -- Timezone
  timezone TEXT DEFAULT 'Asia/Riyadh',

  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(user_id)
);

-- =====================================================
-- TREE CHAT / MESSAGING
-- =====================================================

-- Chat rooms (one per tree, can add more types later)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- Room type
  room_type TEXT DEFAULT 'tree' CHECK (room_type IN ('tree', 'direct', 'group')),

  -- Room info (for group chats)
  name_ar TEXT,
  name_en TEXT,

  -- Settings
  is_active INTEGER DEFAULT 1,

  created_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(tree_id, room_type)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content TEXT NOT NULL,

  -- Reply to another message
  reply_to_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,

  -- Mentions (JSON array of user IDs)
  mentions TEXT,

  -- Media attachment
  media_url TEXT,
  media_type TEXT,

  -- Edit/delete
  is_edited INTEGER DEFAULT 0,
  edited_at INTEGER,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch())
);

-- Message read status
CREATE TABLE IF NOT EXISTS message_read_status (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
  last_read_at INTEGER DEFAULT (unixepoch()),

  UNIQUE(room_id, user_id)
);

-- =====================================================
-- COMMENTS (on persons, photos, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,

  -- What is being commented on
  target_type TEXT NOT NULL CHECK (target_type IN ('person', 'photo', 'story', 'contribution')),
  target_id TEXT NOT NULL,

  -- Comment author
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Reply to another comment
  reply_to_id TEXT REFERENCES comments(id) ON DELETE SET NULL,

  -- Mentions (JSON array of user IDs)
  mentions TEXT,

  -- Edit/delete
  is_edited INTEGER DEFAULT 0,
  edited_at INTEGER,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- EMAIL DIGEST TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS email_digest_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  digest_type TEXT NOT NULL CHECK (digest_type IN ('daily', 'weekly', 'monthly')),

  -- What was included
  notification_count INTEGER DEFAULT 0,
  activity_count INTEGER DEFAULT 0,

  -- Status
  sent_at INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,

  created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tree ON notifications(tree_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_tree ON chat_rooms(tree_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_read_room_user ON message_read_status(room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_comments_tree ON comments(tree_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_digest_user ON email_digest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_digest_type ON email_digest_log(digest_type);
