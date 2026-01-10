-- Migration: 003_donors_donations
-- Created at: 1767863991

-- Donors
CREATE TABLE donors (
    id SERIAL PRIMARY KEY,
    donor_code VARCHAR(50) UNIQUE NOT NULL,
    birth_year INTEGER,
    sex sex_type,
    blood_type VARCHAR(10),
    ethnicity VARCHAR(100),
    medical_history JSONB,
    consent_form_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donors_active ON donors(is_active) WHERE is_active = true;

-- Donations
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    donation_code VARCHAR(50) UNIQUE NOT NULL,
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
    donation_date DATE NOT NULL,
    tissue_type VARCHAR(100) NOT NULL,
    collection_method VARCHAR(100),
    volume_ml DECIMAL(10,2),
    consent_confirmed BOOLEAN NOT NULL DEFAULT false,
    serology_hiv serology_status NOT NULL DEFAULT 'pending',
    serology_hbv serology_status NOT NULL DEFAULT 'pending',
    serology_hcv serology_status NOT NULL DEFAULT 'pending',
    serology_syphilis serology_status NOT NULL DEFAULT 'pending',
    qp_verified BOOLEAN NOT NULL DEFAULT false,
    qp_verified_by_user_id INTEGER REFERENCES users(id),
    qp_verified_at TIMESTAMPTZ,
    qp_verification_notes TEXT,
    status donation_status NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_qp_verified ON donations(qp_verified) WHERE qp_verified = false;;