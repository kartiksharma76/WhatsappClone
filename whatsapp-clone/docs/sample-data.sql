-- ============================================================
--  WhatsApp Clone – Sample Data
--  Passwords are BCrypt of "password123"
-- ============================================================

-- ── Users ─────────────────────────────────────────────────────────────────
INSERT INTO users (full_name, phone, email, password, about, status, is_active, email_verified, role, created_at)
VALUES
  ('Alice Johnson',  '+11111111111', 'alice@chatapp.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hello! I am Alice.', 'ONLINE',  1, 1, 'USER',  NOW()),
  ('Bob Smith',      '+12222222222', 'bob@chatapp.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Available',          'ONLINE',  1, 1, 'USER',  NOW()),
  ('Carol White',    '+13333333333', 'carol@chatapp.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Busy',               'OFFLINE', 1, 1, 'USER',  NOW()),
  ('Dave Brown',     '+14444444444', 'dave@chatapp.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'At work',            'AWAY',    1, 1, 'USER',  NOW()),
  ('Eve Davis',      '+15555555555', 'eve@chatapp.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hey there!',         'ONLINE',  1, 1, 'USER',  NOW()),
  ('Admin User',     '+19999999999', 'admin@chatapp.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Admin',       'ONLINE',  1, 1, 'ADMIN', NOW());

-- ── Private chat: Alice ↔ Bob ─────────────────────────────────────────────
INSERT INTO chats (chat_type, created_by, is_active, created_at) VALUES ('PRIVATE', 1, 1, NOW());
-- Chat ID = 1
INSERT INTO chat_participants VALUES (1, 1), (1, 2);
INSERT INTO user_chats (user_id, chat_id, unread_count) VALUES (1, 1, 0), (2, 1, 2);

-- ── Private chat: Alice ↔ Carol ───────────────────────────────────────────
INSERT INTO chats (chat_type, created_by, is_active, created_at) VALUES ('PRIVATE', 1, 1, NOW());
-- Chat ID = 2
INSERT INTO chat_participants VALUES (2, 1), (2, 3);
INSERT INTO user_chats (user_id, chat_id, unread_count) VALUES (1, 2, 1), (3, 2, 0);

-- ── Group chat ────────────────────────────────────────────────────────────
INSERT INTO chats (chat_type, group_name, group_description, created_by, is_active, created_at)
VALUES ('GROUP', 'Dev Team 🚀', 'Backend & Frontend discussions', 1, 1, NOW());
-- Chat ID = 3
INSERT INTO chat_participants VALUES (3, 1), (3, 2), (3, 3), (3, 4);
INSERT INTO chat_admins     VALUES (3, 1);
INSERT INTO user_chats (user_id, chat_id, unread_count, is_pinned) VALUES
  (1, 3, 0, 1), (2, 3, 3, 0), (3, 3, 1, 0), (4, 3, 5, 0);

-- ── Messages in Alice ↔ Bob chat ──────────────────────────────────────────
INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at) VALUES
  (1, 1, 'Hey Bob! 👋',                          'TEXT', 'SEEN',      DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (1, 2, 'Hi Alice! How are you?',               'TEXT', 'SEEN',      DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1, 1, 'I''m great! Working on the new feature.', 'TEXT', 'SEEN',   DATE_SUB(NOW(), INTERVAL 50 MINUTE)),
  (1, 2, 'Awesome! Need help with anything?',    'TEXT', 'DELIVERED', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
  (1, 1, 'Maybe later, thanks! 😊',              'TEXT', 'SENT',      NOW());

-- Update last message for chat 1
UPDATE chats SET last_message_id = 5, updated_at = NOW() WHERE id = 1;

-- ── Messages in Group chat ────────────────────────────────────────────────
INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at) VALUES
  (3, 1, 'Welcome to the Dev Team chat! 🎉',    'TEXT', 'SEEN', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (3, 2, 'Thanks! Excited to be here.',          'TEXT', 'SEEN', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (3, 3, 'Let''s ship this feature today!',      'TEXT', 'SEEN', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (3, 4, 'Deploy at 5pm?',                       'TEXT', 'SEEN', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
  (3, 1, 'Sounds good 👍',                       'TEXT', 'SENT', DATE_SUB(NOW(), INTERVAL 5 MINUTE));

-- Update last message for chat 3
UPDATE chats SET last_message_id = 10, updated_at = NOW() WHERE id = 3;

-- ── Message reactions ─────────────────────────────────────────────────────
INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES
  (6, 2, '👋', NOW()),
  (6, 3, '😊', NOW()),
  (8, 1, '🔥', NOW()),
  (10, 2, '👍', NOW()),
  (10, 3, '👍', NOW()),
  (10, 4, '❤️', NOW());

-- ── Notifications ─────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, body, reference_id, is_read, created_at) VALUES
  (2, 'NEW_MESSAGE', 'Alice Johnson', 'Hey Bob! 👋',                     1, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (3, 'NEW_MESSAGE', 'Dev Team 🚀',  'Welcome to the Dev Team chat! 🎉', 3, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (1, 'NEW_MESSAGE', 'Bob Smith',    'Hi Alice! How are you?',            1, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR));
