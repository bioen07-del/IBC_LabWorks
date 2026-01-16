-- Add missing step_type enum values
-- Execute this SQL in Supabase Dashboard -> SQL Editor

-- Add passage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'passage'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_type')
    ) THEN
        ALTER TYPE step_type ADD VALUE 'passage';
    END IF;
END $$;

-- Add cell_counting
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'cell_counting'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_type')
    ) THEN
        ALTER TYPE step_type ADD VALUE 'cell_counting';
    END IF;
END $$;

-- Add media_change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'media_change'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_type')
    ) THEN
        ALTER TYPE step_type ADD VALUE 'media_change';
    END IF;
END $$;

-- Add banking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'banking'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_type')
    ) THEN
        ALTER TYPE step_type ADD VALUE 'banking';
    END IF;
END $$;

-- Verify
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'step_type')
ORDER BY enumlabel;
