-- Migration: add_birth_date_to_donors
-- Created at: 1767869806

-- Add birth_date column to donors table
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Migrate existing birth_year data to birth_date (set to Jan 1 of that year)
UPDATE public.donors 
SET birth_date = make_date(birth_year, 1, 1) 
WHERE birth_year IS NOT NULL AND birth_date IS NULL;;