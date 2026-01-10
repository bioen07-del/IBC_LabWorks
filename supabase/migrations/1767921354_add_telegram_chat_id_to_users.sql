-- Migration: add_telegram_chat_id_to_users
-- Created at: 1767921354

ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);;