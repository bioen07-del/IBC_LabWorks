-- Migration: comprehensive_fix
-- Created at: 2026-01-15
-- Description: Fixes RLS policies, adds tissue_types field, and creates step_form_fields table

-- ============================================================================
-- PART 1: RLS POLICIES FOR ALL TABLES
-- ============================================================================

-- EQUIPMENT
CREATE POLICY "Allow anon insert equipment" ON equipment FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update equipment" ON equipment FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete equipment" ON equipment FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert equipment" ON equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update equipment" ON equipment FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete equipment" ON equipment FOR DELETE TO authenticated USING (true);

-- INVENTORY_ITEMS
CREATE POLICY "Allow anon insert inventory_items" ON inventory_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update inventory_items" ON inventory_items FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete inventory_items" ON inventory_items FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert inventory_items" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update inventory_items" ON inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete inventory_items" ON inventory_items FOR DELETE TO authenticated USING (true);

-- PROCESS_TEMPLATES
CREATE POLICY "Allow anon insert process_templates" ON process_templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update process_templates" ON process_templates FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete process_templates" ON process_templates FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert process_templates" ON process_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update process_templates" ON process_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete process_templates" ON process_templates FOR DELETE TO authenticated USING (true);

-- PROCESS_TEMPLATE_STEPS
ALTER TABLE process_template_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select process_template_steps" ON process_template_steps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert process_template_steps" ON process_template_steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update process_template_steps" ON process_template_steps FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete process_template_steps" ON process_template_steps FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated select process_template_steps" ON process_template_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert process_template_steps" ON process_template_steps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update process_template_steps" ON process_template_steps FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete process_template_steps" ON process_template_steps FOR DELETE TO authenticated USING (true);

-- CONTAINERS
CREATE POLICY "Allow anon select containers" ON containers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert containers" ON containers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update containers" ON containers FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete containers" ON containers FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated select containers" ON containers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert containers" ON containers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update containers" ON containers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete containers" ON containers FOR DELETE TO authenticated USING (true);

-- EXECUTED_PROCESSES
ALTER TABLE executed_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select executed_processes" ON executed_processes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert executed_processes" ON executed_processes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update executed_processes" ON executed_processes FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow authenticated select executed_processes" ON executed_processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert executed_processes" ON executed_processes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update executed_processes" ON executed_processes FOR UPDATE TO authenticated USING (true);

-- EXECUTED_STEPS
ALTER TABLE executed_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select executed_steps" ON executed_steps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert executed_steps" ON executed_steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update executed_steps" ON executed_steps FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow authenticated select executed_steps" ON executed_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert executed_steps" ON executed_steps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update executed_steps" ON executed_steps FOR UPDATE TO authenticated USING (true);

-- MEDIA_RECIPES
CREATE POLICY "Allow anon insert media_recipes" ON media_recipes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update media_recipes" ON media_recipes FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete media_recipes" ON media_recipes FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert media_recipes" ON media_recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update media_recipes" ON media_recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete media_recipes" ON media_recipes FOR DELETE TO authenticated USING (true);

-- SOPS
CREATE POLICY "Allow anon insert sops" ON sops FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update sops" ON sops FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete sops" ON sops FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert sops" ON sops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update sops" ON sops FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete sops" ON sops FOR DELETE TO authenticated USING (true);

-- CONTAINER_TYPES
CREATE POLICY "Allow anon insert container_types" ON container_types FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update container_types" ON container_types FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete container_types" ON container_types FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert container_types" ON container_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update container_types" ON container_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete container_types" ON container_types FOR DELETE TO authenticated USING (true);

-- LOCATIONS
CREATE POLICY "Allow anon insert locations" ON locations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update locations" ON locations FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete locations" ON locations FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated insert locations" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update locations" ON locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete locations" ON locations FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- PART 2: ADD TISSUE_TYPES FIELD
-- ============================================================================

ALTER TABLE process_templates ADD COLUMN IF NOT EXISTS tissue_types TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS idx_process_templates_tissue_types ON process_templates USING GIN(tissue_types);
COMMENT ON COLUMN process_templates.tissue_types IS 'Array of tissue types this process applies to';

-- ============================================================================
-- PART 3: ADD STEP_FORM_FIELDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS step_form_fields (
    id SERIAL PRIMARY KEY,
    process_template_step_id INTEGER NOT NULL REFERENCES process_template_steps(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT false,
    validation_rules JSONB,
    options JSONB,
    default_value TEXT,
    help_text TEXT,
    unit VARCHAR(50),
    placeholder TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(process_template_step_id, field_name)
);

CREATE INDEX idx_step_form_fields_step ON step_form_fields(process_template_step_id);
CREATE INDEX idx_step_form_fields_order ON step_form_fields(process_template_step_id, field_order);

ALTER TABLE step_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select step_form_fields" ON step_form_fields FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert step_form_fields" ON step_form_fields FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update step_form_fields" ON step_form_fields FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete step_form_fields" ON step_form_fields FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated select step_form_fields" ON step_form_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert step_form_fields" ON step_form_fields FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update step_form_fields" ON step_form_fields FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete step_form_fields" ON step_form_fields FOR DELETE TO authenticated USING (true);
