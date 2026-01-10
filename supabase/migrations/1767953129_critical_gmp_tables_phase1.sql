-- Migration: critical_gmp_tables_phase1
-- Created at: 1767953129


-- CR-001: Результаты по контейнерам
CREATE TABLE IF NOT EXISTS executed_step_container_results (
    id SERIAL PRIMARY KEY,
    executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,
    container_id INTEGER NOT NULL REFERENCES containers(id),
    recorded_parameters JSONB,
    cca_passed BOOLEAN,
    cca_results JSONB,
    applied_cca_rules JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed_cca')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(executed_step_id, container_id)
);

CREATE INDEX IF NOT EXISTS idx_step_container_results_step ON executed_step_container_results(executed_step_id);
CREATE INDEX IF NOT EXISTS idx_step_container_results_container ON executed_step_container_results(container_id);

-- CR-002: Quality hold в контейнерах
ALTER TABLE containers ADD COLUMN IF NOT EXISTS quality_hold VARCHAR(20) DEFAULT 'none';
ALTER TABLE containers ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS hold_set_at TIMESTAMP;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS hold_set_by_user_id INTEGER REFERENCES users(id);

-- CR-004: Deviation привязка
ALTER TABLE deviations ADD COLUMN IF NOT EXISTS executed_step_container_result_id INTEGER REFERENCES executed_step_container_results(id);

-- Cultures at_risk
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT FALSE;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk_reason TEXT;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk_set_at TIMESTAMP;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS at_risk_set_by_user_id INTEGER REFERENCES users(id);
;