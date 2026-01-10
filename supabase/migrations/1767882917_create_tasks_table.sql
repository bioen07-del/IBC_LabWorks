-- Migration: create_tasks_table
-- Created at: 1767882917

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_code VARCHAR(50) UNIQUE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_user_id INTEGER REFERENCES users(id),
    assigned_to_role VARCHAR(20),
    culture_id INTEGER REFERENCES cultures(id),
    container_id INTEGER REFERENCES containers(id),
    deviation_id INTEGER REFERENCES deviations(id),
    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    completed_by_user_id INTEGER REFERENCES users(id),
    notes TEXT
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_culture ON tasks(culture_id);;