-- Migration: critical_gmp_tables_phase3
-- Created at: 1767953101


-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_code VARCHAR(50) UNIQUE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_user_id INTEGER REFERENCES users(id),
    assigned_to_role VARCHAR(50),
    culture_id INTEGER REFERENCES cultures(id),
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    completed_by_user_id INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_role ON tasks(assigned_to_role, status);

-- Equipment расширение
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS calibration_due_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_calibration_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS calibration_certificate VARCHAR(255);

-- QP Decisions for donations
CREATE TABLE IF NOT EXISTS donation_qp_decisions (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES donations(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'conditional')),
    decided_by_user_id INTEGER NOT NULL REFERENCES users(id),
    decided_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reason TEXT NOT NULL,
    conditions TEXT
);

CREATE INDEX IF NOT EXISTS idx_qp_decisions_donation ON donation_qp_decisions(donation_id, decided_at DESC);

-- Add anon policies
CREATE POLICY IF NOT EXISTS "Allow anon read cca_rules" ON cca_rules FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon read sop_versions" ON sop_versions FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon read notifications" ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon insert notifications" ON notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon read tasks" ON tasks FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon insert tasks" ON tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon update tasks" ON tasks FOR UPDATE TO anon USING (true);
;