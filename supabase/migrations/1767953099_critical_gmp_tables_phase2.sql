-- Migration: critical_gmp_tables_phase2
-- Created at: 1767953099


-- SOP Versions
CREATE TABLE IF NOT EXISTS sop_versions (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sops(id),
    version VARCHAR(20) NOT NULL,
    content_snapshot JSONB NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    approved_by_user_id INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CCA Rules
CREATE TABLE IF NOT EXISTS cca_rules (
    id SERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    sop_id INTEGER REFERENCES sops(id),
    step_number INTEGER,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('range', 'threshold', 'calculation', 'boolean')),
    parameter_name VARCHAR(100) NOT NULL,
    condition JSONB NOT NULL,
    scope VARCHAR(20) DEFAULT 'container' CHECK (scope IN ('container', 'process')),
    block_process_on_fail BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20) DEFAULT 'critical' CHECK (severity IN ('warning', 'critical')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Container media usage (для каскадного карантина)
CREATE TABLE IF NOT EXISTS container_media_usage (
    id SERIAL PRIMARY KEY,
    container_id INTEGER NOT NULL REFERENCES containers(id),
    media_batch_id INTEGER NOT NULL REFERENCES combined_media_batches(id),
    used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    volume_ml NUMERIC(10,2)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
;