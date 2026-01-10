-- Migration: 002_locations_equipment_sops
-- Created at: 1767863977

-- Locations (hierarchical)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_type location_type NOT NULL,
    parent_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    capacity INTEGER,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    is_clean_room BOOLEAN NOT NULL DEFAULT false,
    status location_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_parent ON locations(parent_location_id);
CREATE INDEX idx_locations_type ON locations(location_type);

-- Container types
CREATE TABLE container_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    category container_category NOT NULL,
    volume_ml DECIMAL(10,2),
    surface_area_cm2 DECIMAL(10,2),
    manufacturer VARCHAR(255),
    catalog_number VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipment
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type equipment_type NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    status equipment_status NOT NULL DEFAULT 'operational',
    last_calibration_date DATE,
    calibration_valid_until DATE,
    calibration_frequency_days INTEGER,
    qr_code_data JSONB,
    maintenance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_location ON equipment(location_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_calibration ON equipment(calibration_valid_until);

-- SOPs
CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    sop_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    document_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE,
    review_date DATE,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sops_active ON sops(is_active) WHERE is_active = true;;