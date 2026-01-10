-- Migration: 001_base_enums_and_users
-- Created at: 1767863954

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'qp', 'qc', 'operator', 'viewer');
CREATE TYPE sex_type AS ENUM ('male', 'female', 'other');
CREATE TYPE culture_status AS ENUM ('active', 'frozen', 'hold', 'contaminated', 'disposed');
CREATE TYPE culture_risk_flag AS ENUM ('none', 'at_risk', 'critical');
CREATE TYPE container_status AS ENUM ('active', 'frozen', 'thawed', 'disposed', 'blocked');
CREATE TYPE container_quality_hold AS ENUM ('none', 'system', 'qp');
CREATE TYPE location_type AS ENUM ('room', 'incubator', 'freezer', 'refrigerator', 'shelf', 'rack');
CREATE TYPE location_status AS ENUM ('active', 'maintenance', 'restricted');
CREATE TYPE equipment_type AS ENUM ('incubator', 'laminar_hood', 'centrifuge', 'microscope', 'freezer', 'other');
CREATE TYPE equipment_status AS ENUM ('operational', 'maintenance', 'calibration_due', 'retired');
CREATE TYPE serology_status AS ENUM ('negative', 'positive', 'pending');
CREATE TYPE donation_status AS ENUM ('received', 'processing', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('received', 'in_production', 'qc_pending', 'ready', 'shipped', 'cancelled');
CREATE TYPE order_priority AS ENUM ('standard', 'urgent', 'critical');
CREATE TYPE release_status AS ENUM ('pending_qp', 'approved', 'shipped', 'delivered', 'rejected');
CREATE TYPE deviation_type AS ENUM ('cca_fail', 'contamination', 'process_violation', 'equipment_failure', 'other');
CREATE TYPE deviation_severity AS ENUM ('minor', 'major', 'critical');
CREATE TYPE deviation_status AS ENUM ('open', 'under_review', 'resolved', 'escalated');
CREATE TYPE qp_decision AS ENUM ('continue', 'quarantine', 'dispose');
CREATE TYPE qc_test_type AS ENUM ('sterility', 'mycoplasma', 'endotoxin', 'viability', 'identity', 'potency');
CREATE TYPE qc_result_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'inconclusive');
CREATE TYPE inventory_category AS ENUM ('media', 'serum', 'reagent', 'consumable', 'additive');
CREATE TYPE inventory_status AS ENUM ('active', 'quarantined', 'expired', 'depleted', 'disposed');
CREATE TYPE qc_status AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE media_recipe_type AS ENUM ('base', 'combined');
CREATE TYPE component_type AS ENUM ('base_medium', 'serum', 'antibiotic', 'growth_factor', 'supplement');
CREATE TYPE media_batch_status AS ENUM ('active', 'quarantined', 'expired', 'depleted', 'disposed');
CREATE TYPE sterility_status AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE transaction_type AS ENUM ('receipt', 'usage', 'disposal', 'adjustment', 'quarantine');
CREATE TYPE step_type AS ENUM ('measurement', 'manipulation', 'incubation', 'observation');
CREATE TYPE process_status AS ENUM ('in_progress', 'completed', 'paused', 'aborted', 'paused_quality_hold');
CREATE TYPE step_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE step_result_status AS ENUM ('draft', 'completed', 'failed_cca', 'voided');
CREATE TYPE session_type AS ENUM ('passage', 'thawing', 'freezing', 'qc_sampling', 'other');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'aborted');
CREATE TYPE container_category AS ENUM ('flask', 'plate', 'cryovial', 'bag', 'bioreactor');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'print', 'export');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT true,
    password_hash VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Telegram users
CREATE TABLE telegram_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(100),
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_code VARCHAR(20),
    verification_sent_at TIMESTAMPTZ,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    notification_preferences JSONB DEFAULT '{"deviations": true, "new_cultures": false, "qc_results": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);;