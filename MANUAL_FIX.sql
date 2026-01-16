-- MANUAL FIX SQL - Execute this in Supabase Dashboard -> SQL Editor
-- This script fixes:
-- 1. Adds missing step_type enum values
-- 2. Inserts process templates with steps
-- 3. Adds RLS policies for dictionaries

-- ============================================================================
-- Part 1: Fix step_type enum
-- ============================================================================

-- Check if values exist, add if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'media_change' AND enumtypid = 'step_type'::regtype) THEN
        ALTER TYPE step_type ADD VALUE 'media_change';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'banking' AND enumtypid = 'step_type'::regtype) THEN
        ALTER TYPE step_type ADD VALUE 'banking';
    END IF;
END$$;

-- ============================================================================
-- Part 2: Process Templates (copy from 1768500000_fix_process_templates.sql)
-- ============================================================================

-- Delete old templates
DELETE FROM process_templates WHERE template_code IN ('PROC-PASSAGE-V1', 'PROC-FREEZING-V1', 'PROC-THAWING-V1');

-- Insert new templates and steps
-- (Content from migrations/1768500000_fix_process_templates.sql)

-- Template 1: Bone Marrow Isolation
INSERT INTO process_templates (template_code, name, description, version, applicable_tissue_types, applicable_cell_types, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-BM-ISOLATION-V1', 'Выделение клеток из костного мозга', 'Стандартный протокол выделения мононуклеарных клеток из костного мозга методом градиентного центрифугирования', 'v1.0',
'["Bone Marrow"]', '["MSC", "Hematopoietic"]', 180, true, true)
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_equipment_scan, requires_sop_confirmation) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 1, 'Приём образца', 'observation', 'Проверка маркировки образца, целостности контейнера, температуры доставки', false, 5, false, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 2, 'Разведение костного мозга', 'passage', 'Развести костный мозг PBS или физраствором в соотношении 1:1', false, 10, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 3, 'Нанесение на градиент', 'passage', 'Нанести разведенную суспензию на градиент Ficoll-Paque (плотность 1.077 г/мл)', false, 15, false, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 4, 'Центрифугирование', 'passage', 'Центрифугирование при 400g, 30 минут, комнатная температура, без торможения', true, 30, true, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 5, 'Сбор мононуклеаров', 'passage', 'Собрать интерфазу (слой мононуклеарных клеток) пастеровской пипеткой', false, 10, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 6, 'Отмывка клеток', 'passage', 'Трижды отмыть клетки PBS, центрифугируя при 300g по 10 минут', false, 40, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 7, 'Подсчёт клеток', 'cell_counting', 'Подсчитать концентрацию и жизнеспособность клеток трипановым синим', true, 10, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 8, 'Первичный посев', 'passage', 'Посеять клетки в культуральные флаконы с плотностью 10000-20000 кл/см²', false, 20, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 9, 'Инкубация', 'observation', 'Поместить флаконы в СО2-инкубатор (37°C, 5% CO2)', false, 1440, false, false)
ON CONFLICT DO NOTHING;

-- More templates...  (see full migration file for complete code)

-- ============================================================================
-- Part 3: RLS Policies (copy from 1768510000_fix_rls_policies_dictionaries.sql)
-- ============================================================================

-- Container Types policies
DROP POLICY IF EXISTS "Allow insert container_types for authenticated users" ON container_types;
DROP POLICY IF EXISTS "Allow update container_types for authenticated users" ON container_types;
DROP POLICY IF EXISTS "Allow delete container_types for authenticated users" ON container_types;

CREATE POLICY "Allow insert container_types for authenticated users"
ON container_types FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update container_types for authenticated users"
ON container_types FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete container_types for authenticated users"
ON container_types FOR DELETE
TO authenticated
USING (true);

-- Process Templates policies
DROP POLICY IF EXISTS "Allow insert process_templates for authenticated users" ON process_templates;
DROP POLICY IF EXISTS "Allow update process_templates for authenticated users" ON process_templates;
DROP POLICY IF EXISTS "Allow delete process_templates for authenticated users" ON process_templates;

CREATE POLICY "Allow insert process_templates for authenticated users"
ON process_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update process_templates for authenticated users"
ON process_templates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete process_templates for authenticated users"
ON process_templates FOR DELETE
TO authenticated
USING (true);

-- Process Template Steps policies
DROP POLICY IF EXISTS "Allow insert process_template_steps for authenticated users" ON process_template_steps;
DROP POLICY IF EXISTS "Allow update process_template_steps for authenticated users" ON process_template_steps;
DROP POLICY IF EXISTS "Allow delete process_template_steps for authenticated users" ON process_template_steps;

CREATE POLICY "Allow insert process_template_steps for authenticated users"
ON process_template_steps FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update process_template_steps for authenticated users"
ON process_template_steps FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete process_template_steps for authenticated users"
ON process_template_steps FOR DELETE
TO authenticated
USING (true);

-- More policies... (see full migration file)

-- ============================================================================
-- Verification queries
-- ============================================================================

SELECT 'Process Templates Created:' as status, COUNT(*) as count FROM process_templates WHERE template_code LIKE 'PROC-%V%';
SELECT 'Process Steps Created:' as status, COUNT(*) as count FROM process_template_steps;
SELECT 'Policies Created:' as status, COUNT(*) as count FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('container_types', 'process_templates', 'process_template_steps');
