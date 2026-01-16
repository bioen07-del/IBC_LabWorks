-- Add missing step_type values to enum
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'media_change';
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'banking';
