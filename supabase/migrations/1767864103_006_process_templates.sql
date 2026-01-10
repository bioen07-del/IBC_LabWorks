-- Migration: 006_process_templates
-- Created at: 1767864103

-- Process templates (SOP-based)
CREATE TABLE process_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    applicable_cell_types JSONB,
    estimated_duration_minutes INTEGER,
    requires_clean_room BOOLEAN NOT NULL DEFAULT true,
    sop_document_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_process_templates_active ON process_templates(is_active) WHERE is_active = true;

-- Process template steps
CREATE TABLE process_template_steps (
    id SERIAL PRIMARY KEY,
    process_template_id INTEGER NOT NULL REFERENCES process_templates(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_type step_type NOT NULL,
    description TEXT,
    sop_reference VARCHAR(100),
    sop_id INTEGER REFERENCES sops(id),
    requires_sop_confirmation BOOLEAN NOT NULL DEFAULT false,
    expected_duration_minutes INTEGER,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    requires_equipment_scan BOOLEAN NOT NULL DEFAULT false,
    expected_equipment_id INTEGER REFERENCES equipment(id),
    required_parameters JSONB,
    cca_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(process_template_id, step_number)
);

CREATE INDEX idx_template_steps_template ON process_template_steps(process_template_id);

-- Sessions (laminar work sessions)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(50) UNIQUE NOT NULL,
    session_type session_type NOT NULL,
    started_by_user_id INTEGER NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    location_id INTEGER REFERENCES locations(id),
    status session_status NOT NULL DEFAULT 'in_progress',
    cultures_processed JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(started_by_user_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Executed processes
CREATE TABLE executed_processes (
    id SERIAL PRIMARY KEY,
    process_code VARCHAR(50) UNIQUE NOT NULL,
    process_template_id INTEGER NOT NULL REFERENCES process_templates(id),
    culture_id INTEGER NOT NULL REFERENCES cultures(id),
    container_ids JSONB,
    started_by_user_id INTEGER NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status process_status NOT NULL DEFAULT 'in_progress',
    session_id INTEGER REFERENCES sessions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exec_proc_template ON executed_processes(process_template_id);
CREATE INDEX idx_exec_proc_culture ON executed_processes(culture_id);
CREATE INDEX idx_exec_proc_status ON executed_processes(status);
CREATE INDEX idx_exec_proc_session ON executed_processes(session_id);

-- Executed steps
CREATE TABLE executed_steps (
    id SERIAL PRIMARY KEY,
    executed_process_id INTEGER NOT NULL REFERENCES executed_processes(id) ON DELETE CASCADE,
    process_template_step_id INTEGER NOT NULL REFERENCES process_template_steps(id),
    container_id INTEGER REFERENCES containers(id),
    executed_by_user_id INTEGER REFERENCES users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status step_status NOT NULL DEFAULT 'pending',
    recorded_parameters JSONB,
    sop_confirmed_at TIMESTAMPTZ,
    scanned_equipment_id INTEGER REFERENCES equipment(id),
    equipment_scan_timestamp TIMESTAMPTZ,
    media_batch_used_id INTEGER REFERENCES combined_media_batches(id),
    cca_passed BOOLEAN,
    cca_results JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exec_steps_process ON executed_steps(executed_process_id);
CREATE INDEX idx_exec_steps_container ON executed_steps(container_id);
CREATE INDEX idx_exec_steps_status ON executed_steps(status);

-- Executed step container results (CR-001: per-container results)
CREATE TABLE executed_step_container_results (
    id SERIAL PRIMARY KEY,
    executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,
    container_id INTEGER NOT NULL REFERENCES containers(id),
    status step_result_status NOT NULL DEFAULT 'draft',
    recorded_parameters JSONB,
    cca_passed BOOLEAN,
    cca_results JSONB,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_by_user_id INTEGER REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    UNIQUE(executed_step_id, container_id)
);

CREATE INDEX idx_escr_step ON executed_step_container_results(executed_step_id);
CREATE INDEX idx_escr_container ON executed_step_container_results(container_id);

-- Add FK to inventory_transactions
ALTER TABLE inventory_transactions 
ADD CONSTRAINT fk_inv_trans_step 
FOREIGN KEY (executed_step_id) REFERENCES executed_steps(id);;