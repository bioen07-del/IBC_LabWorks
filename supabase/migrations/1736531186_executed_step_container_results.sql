-- ЗАДАЧА 1: Таблица executed_step_container_results (CR-001)
-- Хранит результаты CCA по каждому контейнеру отдельно

CREATE TABLE IF NOT EXISTS executed_step_container_results (
  id SERIAL PRIMARY KEY,
  executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,
  container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  recorded_parameters JSONB DEFAULT '{}',
  cca_passed BOOLEAN,
  cca_results JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'blocked')),
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(executed_step_id, container_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_escr_step ON executed_step_container_results(executed_step_id);
CREATE INDEX IF NOT EXISTS idx_escr_container ON executed_step_container_results(container_id);
CREATE INDEX IF NOT EXISTS idx_escr_status ON executed_step_container_results(status);

-- RLS политики
ALTER TABLE executed_step_container_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read executed_step_container_results" ON executed_step_container_results
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert executed_step_container_results" ON executed_step_container_results
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update executed_step_container_results" ON executed_step_container_results
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ЗАДАЧА 6: Добавить поля tissue_types, cell_types в process_templates
ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS tissue_types JSONB DEFAULT '[]';
ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS cell_types JSONB DEFAULT '[]';

-- ЗАДАЧА 7: Добавить поля at_risk в cultures
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT FALSE;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk_reason TEXT;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk_set_at TIMESTAMP WITH TIME ZONE;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_escr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_escr_updated_at ON executed_step_container_results;
CREATE TRIGGER trg_escr_updated_at
  BEFORE UPDATE ON executed_step_container_results
  FOR EACH ROW EXECUTE FUNCTION update_escr_updated_at();

COMMENT ON TABLE executed_step_container_results IS 'CCA результаты по каждому контейнеру (ALCOA+ compliance)';
