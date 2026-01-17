-- ====================================================================
-- МИГРАЦИЯ: Добавление полей для уведомлений и действий с культурами
-- ИНСТРУКЦИЯ: Скопируйте весь этот файл и выполните в Supabase Dashboard → SQL Editor
-- ====================================================================

-- Поля для кормления
ALTER TABLE cultures
  ADD COLUMN IF NOT EXISTS last_fed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_feeding_due TIMESTAMP,
  ADD COLUMN IF NOT EXISTS feeding_interval_days INT DEFAULT 3;

-- Поля для осмотра
ALTER TABLE cultures
  ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_observation_due TIMESTAMP,
  ADD COLUMN IF NOT EXISTS observation_interval_days INT DEFAULT 2;

-- Поля для данных осмотра
ALTER TABLE cultures
  ADD COLUMN IF NOT EXISTS confluence_percent INT,
  ADD COLUMN IF NOT EXISTS morphology_notes TEXT,
  ADD COLUMN IF NOT EXISTS sterility_status TEXT CHECK (sterility_status IN ('sterile', 'contaminated', 'unknown'));

-- Комментарии для документации
COMMENT ON COLUMN cultures.last_fed_at IS 'Дата и время последнего кормления культуры';
COMMENT ON COLUMN cultures.next_feeding_due IS 'Дата и время следующего планового кормления';
COMMENT ON COLUMN cultures.feeding_interval_days IS 'Интервал между кормлениями в днях (по умолчанию 3)';

COMMENT ON COLUMN cultures.last_observed_at IS 'Дата и время последнего осмотра культуры';
COMMENT ON COLUMN cultures.next_observation_due IS 'Дата и время следующего планового осмотра';
COMMENT ON COLUMN cultures.observation_interval_days IS 'Интервал между осмотрами в днях (по умолчанию 2)';

COMMENT ON COLUMN cultures.confluence_percent IS 'Процент заполнения монослоя (0-100)';
COMMENT ON COLUMN cultures.morphology_notes IS 'Заметки о морфологии клеток при последнем осмотре';
COMMENT ON COLUMN cultures.sterility_status IS 'Статус стерильности: sterile/contaminated/unknown';

-- Проверка результата
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cultures'
  AND column_name IN (
    'last_fed_at', 'next_feeding_due', 'feeding_interval_days',
    'last_observed_at', 'next_observation_due', 'observation_interval_days',
    'confluence_percent', 'morphology_notes', 'sterility_status'
  )
ORDER BY column_name;
