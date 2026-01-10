-- Migration: add_donor_donation_fields
-- Created at: 1767868431

-- Дополнительные поля донора
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS health_notes TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT;

-- Дополнительные поля донации
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS cell_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS contract_date DATE;

COMMENT ON COLUMN donors.full_name IS 'ФИО донора';
COMMENT ON COLUMN donors.health_notes IS 'Заметки о здоровье';
COMMENT ON COLUMN donations.cell_type IS 'Тип клеток (фибробласты, кератиноциты и т.д.)';
COMMENT ON COLUMN donations.contract_number IS 'Номер договора на донацию';
COMMENT ON COLUMN donations.contract_date IS 'Дата договора';;