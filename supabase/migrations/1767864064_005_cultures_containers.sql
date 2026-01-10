-- Migration: 005_cultures_containers
-- Created at: 1767864064

-- Cultures (центральная сущность)
CREATE TABLE cultures (
    id SERIAL PRIMARY KEY,
    culture_code VARCHAR(50) UNIQUE NOT NULL,
    donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE RESTRICT,
    cell_type VARCHAR(100) NOT NULL,
    tissue_source VARCHAR(100),
    current_passage INTEGER NOT NULL DEFAULT 0,
    status culture_status NOT NULL DEFAULT 'active',
    risk_flag culture_risk_flag NOT NULL DEFAULT 'none',
    risk_flag_reason TEXT,
    risk_flag_set_at TIMESTAMPTZ,
    risk_flag_cleared_at TIMESTAMPTZ,
    media_batch_used_id INTEGER REFERENCES combined_media_batches(id),
    order_id INTEGER REFERENCES orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cultures_donation ON cultures(donation_id);
CREATE INDEX idx_cultures_status ON cultures(status);
CREATE INDEX idx_cultures_risk ON cultures(risk_flag) WHERE risk_flag != 'none';
CREATE INDEX idx_cultures_order ON cultures(order_id);
CREATE INDEX idx_cultures_media ON cultures(media_batch_used_id);

-- Containers
CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    container_code VARCHAR(100) UNIQUE NOT NULL,
    culture_id INTEGER NOT NULL REFERENCES cultures(id) ON DELETE RESTRICT,
    container_type_id INTEGER NOT NULL REFERENCES container_types(id),
    passage_number INTEGER NOT NULL DEFAULT 0,
    split_index INTEGER NOT NULL DEFAULT 1,
    status container_status NOT NULL DEFAULT 'active',
    quality_hold container_quality_hold NOT NULL DEFAULT 'none',
    hold_reason TEXT,
    hold_set_at TIMESTAMPTZ,
    hold_set_by_user_id INTEGER REFERENCES users(id),
    location_id INTEGER REFERENCES locations(id),
    qr_code_data JSONB,
    volume_ml DECIMAL(10,2),
    cell_concentration DECIMAL(15,2),
    viability_percent DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    frozen_at TIMESTAMPTZ,
    thawed_at TIMESTAMPTZ,
    disposed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_containers_culture ON containers(culture_id);
CREATE INDEX idx_containers_status ON containers(status);
CREATE INDEX idx_containers_location ON containers(location_id);
CREATE INDEX idx_containers_passage ON containers(passage_number);
CREATE INDEX idx_containers_quality_hold ON containers(quality_hold) WHERE quality_hold != 'none';;