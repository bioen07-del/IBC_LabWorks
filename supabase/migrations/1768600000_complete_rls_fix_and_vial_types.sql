-- Migration: Complete RLS fix and add vial_types table
-- Created at: 2026-01-17
-- Purpose: Fix all RLS policies for dictionaries and add vial types

-- ==========================================
-- Part 1: Fix RLS Policies for Dictionaries
-- ==========================================

-- Media Recipe Components policies (MISSING!)
ALTER TABLE media_recipe_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read media_recipe_components for authenticated" ON media_recipe_components;
DROP POLICY IF EXISTS "Allow insert media_recipe_components for authenticated" ON media_recipe_components;
DROP POLICY IF EXISTS "Allow update media_recipe_components for authenticated" ON media_recipe_components;
DROP POLICY IF EXISTS "Allow delete media_recipe_components for authenticated" ON media_recipe_components;

CREATE POLICY "Allow read media_recipe_components for authenticated"
ON media_recipe_components FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert media_recipe_components for authenticated"
ON media_recipe_components FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update media_recipe_components for authenticated"
ON media_recipe_components FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete media_recipe_components for authenticated"
ON media_recipe_components FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- Part 2: Create Vial Types Table
-- ==========================================

CREATE TABLE IF NOT EXISTS vial_types (
  id SERIAL PRIMARY KEY,
  type_code VARCHAR(50) UNIQUE NOT NULL,
  type_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'cryovial', -- 'cryovial', 'tube', 'other'
  manufacturer VARCHAR(200),
  catalog_number VARCHAR(100),
  volume_ml NUMERIC(10,2),
  material VARCHAR(100), -- 'polypropylene', 'glass', 'PETG', etc.
  cap_type VARCHAR(100), -- 'screw', 'snap', 'cork', etc.
  sterile BOOLEAN DEFAULT true,
  suitable_for_ln2 BOOLEAN DEFAULT true,
  suitable_for_vapor BOOLEAN DEFAULT true,
  suitable_for_minus80 BOOLEAN DEFAULT true,
  max_temperature_c NUMERIC(5,1),
  min_temperature_c NUMERIC(5,1) DEFAULT -196,
  barcode_compatible BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vial_types_category ON vial_types(category);
CREATE INDEX IF NOT EXISTS idx_vial_types_active ON vial_types(is_active);

-- Enable RLS
ALTER TABLE vial_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read vial_types for authenticated"
ON vial_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert vial_types for authenticated"
ON vial_types FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update vial_types for authenticated"
ON vial_types FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete vial_types for authenticated"
ON vial_types FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- Part 3: Seed Initial Vial Types Data
-- ==========================================

INSERT INTO vial_types (type_code, type_name, category, manufacturer, catalog_number, volume_ml, material, cap_type, suitable_for_ln2, suitable_for_vapor, suitable_for_minus80, max_temperature_c, min_temperature_c, notes)
VALUES
  ('CRYO-1ML-PP', 'Криовиала 1 мл полипропилен', 'cryovial', 'Thermo Fisher', '377267', 1.0, 'polypropylene', 'screw', true, true, true, 121, -196, 'Стандартная криовиала для жидкого азота'),
  ('CRYO-2ML-PP', 'Криовиала 2 мл полипропилен', 'cryovial', 'Thermo Fisher', '377224', 2.0, 'polypropylene', 'screw', true, true, true, 121, -196, 'Увеличенный объём для больших объёмов клеток'),
  ('CRYO-5ML-PP', 'Криовиала 5 мл полипропилен', 'cryovial', 'Corning', '430659', 5.0, 'polypropylene', 'screw', true, true, true, 121, -196, 'Для больших объёмов суспензии клеток'),
  ('CRYO-1.5ML-INT', 'Криовиала 1.5 мл внутренняя резьба', 'cryovial', 'Nalgene', '5000-0015', 1.5, 'polypropylene', 'screw', true, true, true, 121, -196, 'С внутренней резьбой для надёжности'),
  ('CRYO-BAG-50ML', 'Криопакет 50 мл', 'cryobag', 'OriGen', 'CS-500', 50, 'EVA/PETG', 'port', true, true, false, 60, -196, 'Для хранения больших объёмов клеток'),
  ('TUBE-15ML', 'Пробирка 15 мл (для -80°C)', 'tube', 'Corning', '430791', 15, 'polypropylene', 'screw', false, false, true, 121, -80, 'Для временного хранения при -80°C')
ON CONFLICT (type_code) DO NOTHING;

-- ==========================================
-- Part 4: Create Frozen Vials Table
-- ==========================================

-- This table tracks individual frozen vials from banking operations
CREATE TABLE IF NOT EXISTS frozen_vials (
  id SERIAL PRIMARY KEY,
  vial_code VARCHAR(100) UNIQUE NOT NULL,
  culture_id INTEGER NOT NULL REFERENCES cultures(id) ON DELETE RESTRICT,
  bank_type VARCHAR(10) NOT NULL CHECK (bank_type IN ('mcb', 'wcb')),
  vial_type_id INTEGER NOT NULL REFERENCES vial_types(id),
  passage_number INTEGER,
  cells_per_vial NUMERIC(15,2),
  cells_per_ml NUMERIC(15,2),
  volume_ml NUMERIC(10,2),
  cryopreservation_media VARCHAR(200),
  freezing_method VARCHAR(50) CHECK (freezing_method IN ('programmed', 'manual', 'direct_ln2')),
  freezing_rate VARCHAR(50),
  storage_temperature VARCHAR(50),
  storage_location_id INTEGER REFERENCES locations(id),
  storage_position VARCHAR(100), -- e.g., "Box 1, A-3"
  freezing_date DATE NOT NULL,
  frozen_by_user_id INTEGER REFERENCES users(id),
  thaw_date DATE,
  thawed_by_user_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'frozen' CHECK (status IN ('frozen', 'thawed', 'discarded', 'qc_fail')),
  qc_status VARCHAR(20) DEFAULT 'pending' CHECK (qc_status IN ('pending', 'passed', 'failed')),
  qc_viability_percent NUMERIC(5,2),
  qc_notes TEXT,
  notes TEXT,
  qr_code_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_frozen_vials_culture ON frozen_vials(culture_id);
CREATE INDEX IF NOT EXISTS idx_frozen_vials_bank_type ON frozen_vials(bank_type);
CREATE INDEX IF NOT EXISTS idx_frozen_vials_status ON frozen_vials(status);
CREATE INDEX IF NOT EXISTS idx_frozen_vials_location ON frozen_vials(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_frozen_vials_freezing_date ON frozen_vials(freezing_date);

-- Enable RLS
ALTER TABLE frozen_vials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read frozen_vials for authenticated"
ON frozen_vials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert frozen_vials for authenticated"
ON frozen_vials FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update frozen_vials for authenticated"
ON frozen_vials FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete frozen_vials for authenticated"
ON frozen_vials FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- Part 5: Add Updated Trigger
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vial_types_updated_at BEFORE UPDATE ON vial_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frozen_vials_updated_at BEFORE UPDATE ON frozen_vials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vial_types IS 'Справочник типов виал и пробирок для криоконсервации';
COMMENT ON TABLE frozen_vials IS 'Учёт индивидуальных замороженных виал с клетками';
