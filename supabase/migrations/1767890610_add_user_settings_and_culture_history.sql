-- Migration: add_user_settings_and_culture_history
-- Created at: 1767890610


-- Таблица настроек пользователей
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  telegram_chat_id TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS для user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Таблица истории культур
CREATE TABLE IF NOT EXISTS culture_history (
  id SERIAL PRIMARY KEY,
  culture_id INTEGER REFERENCES cultures(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS для culture_history
ALTER TABLE culture_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view culture history" ON culture_history 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert culture history" ON culture_history 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Индексы
CREATE INDEX idx_culture_history_culture_id ON culture_history(culture_id);
CREATE INDEX idx_culture_history_performed_at ON culture_history(performed_at DESC);
;