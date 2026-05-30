-- ============================================================
--  WhatsApp Clone – Database Schema
--  MySQL 8.0+
--  Run this once against an empty `chatapp` database
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    full_name        VARCHAR(100)  NOT NULL,
    phone            VARCHAR(20)   NOT NULL UNIQUE,
    email            VARCHAR(255)  NOT NULL UNIQUE,
    password         VARCHAR(255)  NOT NULL,
    about            VARCHAR(500)  DEFAULT 'Hey there! I''m using ChatApp',
    profile_picture  VARCHAR(500)  NULL,
    status           ENUM('ONLINE','OFFLINE','AWAY') NOT NULL DEFAULT 'OFFLINE',
    last_seen        DATETIME(6)   NULL,
    is_active        TINYINT(1)    NOT NULL DEFAULT 1,
    email_verified   TINYINT(1)    NOT NULL DEFAULT 0,
    role             ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at       DATETIME(6)   NOT NULL,
    updated_at       DATETIME(6)   NULL,
    PRIMARY KEY (id),
    INDEX idx_user_email  (email),
    INDEX idx_user_phone  (phone),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Blocked users (self-referencing M:M) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Chats ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    chat_type         ENUM('PRIVATE','GROUP') NOT NULL,
    group_name        VARCHAR(100)  NULL,
    group_description VARCHAR(500)  NULL,
    group_icon        VARCHAR(500)  NULL,
    created_by        BIGINT        NULL,
    last_message_id   BIGINT        NULL,
    is_active         TINYINT(1)    NOT NULL DEFAULT 1,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NULL,
    PRIMARY KEY (id),
    INDEX idx_chat_type       (chat_type),
    INDEX idx_chat_updated    (updated_at),
    CONSTRAINT fk_chat_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Chat participants ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    CONSTRAINT fk_cp_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Chat admins (for group chats) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_admins (
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    CONSTRAINT fk_ca_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Per-user chat preferences ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_chats (
    id           BIGINT     NOT NULL AUTO_INCREMENT,
    user_id      BIGINT     NOT NULL,
    chat_id      BIGINT     NOT NULL,
    is_pinned    TINYINT(1) NOT NULL DEFAULT 0,
    is_archived  TINYINT(1) NOT NULL DEFAULT 0,
    is_muted     TINYINT(1) NOT NULL DEFAULT 0,
    unread_count INT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_chat (user_id, chat_id),
    CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_uc_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Messages ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    chat_id         BIGINT       NOT NULL,
    sender_id       BIGINT       NOT NULL,
    content         TEXT         NULL,
    message_type    ENUM('TEXT','IMAGE','VIDEO','AUDIO','VOICE','FILE','EMOJI','SYSTEM','LOCATION')
                                 NOT NULL DEFAULT 'TEXT',
    file_url        VARCHAR(500) NULL,
    file_name       VARCHAR(255) NULL,
    file_size       BIGINT       NULL,
    file_mime_type  VARCHAR(100) NULL,
    media_duration  INT          NULL COMMENT 'Duration in seconds for voice/video',
    thumbnail_url   VARCHAR(500) NULL,
    status          ENUM('SENDING','SENT','DELIVERED','SEEN','FAILED') NOT NULL DEFAULT 'SENT',
    reply_to_id     BIGINT       NULL,
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    deleted_at      DATETIME(6)  NULL,
    is_edited       TINYINT(1)   NOT NULL DEFAULT 0,
    edited_at       DATETIME(6)  NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NULL,
    PRIMARY KEY (id),
    INDEX idx_message_chat    (chat_id),
    INDEX idx_message_sender  (sender_id),
    INDEX idx_message_created (created_at),
    INDEX idx_message_status  (status),
    CONSTRAINT fk_msg_chat    FOREIGN KEY (chat_id)    REFERENCES chats(id)    ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender  FOREIGN KEY (sender_id)  REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_msg_reply   FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add last_message FK after messages table exists
ALTER TABLE chats
    ADD CONSTRAINT fk_chat_last_msg
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ── Message reactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_reactions (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    message_id BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    emoji      VARCHAR(10) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_msg_user_reaction (message_id, user_id),
    CONSTRAINT fk_react_msg  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_react_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Per-recipient delivery receipts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_receipts (
    id           BIGINT   NOT NULL AUTO_INCREMENT,
    message_id   BIGINT   NOT NULL,
    user_id      BIGINT   NOT NULL,
    status       ENUM('SENDING','SENT','DELIVERED','SEEN','FAILED') NOT NULL DEFAULT 'SENT',
    delivered_at DATETIME(6) NULL,
    seen_at      DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receipt (message_id, user_id),
    INDEX idx_receipt_status (status),
    CONSTRAINT fk_receipt_msg  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    type         ENUM('NEW_MESSAGE','GROUP_INVITE','FRIEND_REQUEST','SYSTEM') NOT NULL,
    title        VARCHAR(255) NOT NULL,
    body         VARCHAR(500) NOT NULL,
    reference_id BIGINT       NULL,
    is_read      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_notif_user  (user_id),
    INDEX idx_notif_read  (is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
