-- Migration: 007_deviations_qc_releases_audit
-- Created at: 1767864141

-- Deviations
CREATE TABLE deviations (
    id SERIAL PRIMARY KEY,
    deviation_code VARCHAR(50) UNIQUE NOT NULL,
    deviation_type deviation_type NOT NULL,
    severity deviation_severity NOT NULL DEFAULT 'minor',
    culture_id INTEGER REFERENCES cultures(id),
    container_id INTEGER REFERENCES containers(id),
    executed_step_id INTEGER REFERENCES executed_steps(id),
    executed_step_container_result_id INTEGER REFERENCES executed_step_container_results(id),
    description TEXT NOT NULL,
    detected_by_user_id INTEGER NOT NULL REFERENCES users(id),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status deviation_status NOT NULL DEFAULT 'open',
    qp_review_required BOOLEAN NOT NULL DEFAULT true,
    qp_notified_at TIMESTAMPTZ,
    qp_reviewed_by_user_id INTEGER REFERENCES users(id),
    qp_reviewed_at TIMESTAMPTZ,
    qp_review_decision qp_decision,
    qp_review_comments TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deviations_culture ON deviations(culture_id);
CREATE INDEX idx_deviations_container ON deviations(container_id);
CREATE INDEX idx_deviations_status ON deviations(status);
CREATE INDEX idx_deviations_severity ON deviations(severity);
CREATE INDEX idx_deviations_open ON deviations(status) WHERE status = 'open';
CREATE UNIQUE INDEX uq_deviation_cca_once ON deviations(deviation_type, executed_step_container_result_id) 
WHERE deviation_type = 'cca_fail' AND executed_step_container_result_id IS NOT NULL;

-- QC Tests
CREATE TABLE qc_tests (
    id SERIAL PRIMARY KEY,
    test_code VARCHAR(50) UNIQUE NOT NULL,
    culture_id INTEGER NOT NULL REFERENCES cultures(id),
    container_id INTEGER REFERENCES containers(id),
    test_type qc_test_type NOT NULL,
    test_method VARCHAR(255),
    requested_by_user_id INTEGER NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by_user_id INTEGER REFERENCES users(id),
    performed_at TIMESTAMPTZ,
    result_status qc_result_status NOT NULL DEFAULT 'pending',
    result_value TEXT,
    result_notes TEXT,
    certificate_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qc_tests_culture ON qc_tests(culture_id);
CREATE INDEX idx_qc_tests_status ON qc_tests(result_status);
CREATE INDEX idx_qc_tests_type ON qc_tests(test_type);

-- Releases
CREATE TABLE releases (
    id SERIAL PRIMARY KEY,
    release_code VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    culture_id INTEGER NOT NULL REFERENCES cultures(id),
    container_ids JSONB,
    release_date DATE,
    qp_approved_by_user_id INTEGER REFERENCES users(id),
    qp_approved_at TIMESTAMPTZ,
    certificate_of_analysis_url VARCHAR(500),
    shipping_conditions JSONB,
    recipient_signature_url VARCHAR(500),
    status release_status NOT NULL DEFAULT 'pending_qp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_releases_order ON releases(order_id);
CREATE INDEX idx_releases_culture ON releases(culture_id);
CREATE INDEX idx_releases_status ON releases(status);

-- Audit Log (GMP compliance)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id),
    action_type audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    changes JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    comment TEXT
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- Code generation sequences
CREATE SEQUENCE donor_code_seq START 1;
CREATE SEQUENCE donation_code_seq START 1;
CREATE SEQUENCE culture_code_seq START 1;
CREATE SEQUENCE order_code_seq START 1;
CREATE SEQUENCE release_code_seq START 1;
CREATE SEQUENCE deviation_code_seq START 1;
CREATE SEQUENCE qc_test_code_seq START 1;
CREATE SEQUENCE process_code_seq START 1;
CREATE SEQUENCE session_code_seq START 1;
CREATE SEQUENCE media_batch_code_seq START 1;
CREATE SEQUENCE inventory_code_seq START 1;;