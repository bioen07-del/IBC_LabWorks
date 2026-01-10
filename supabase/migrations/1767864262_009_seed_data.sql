-- Migration: 009_seed_data
-- Created at: 1767864262

-- Seed container types
INSERT INTO container_types (type_code, type_name, category, volume_ml, surface_area_cm2, is_active) VALUES
('T25', 'Флакон T25', 'flask', 5, 25, true),
('T75', 'Флакон T75', 'flask', 15, 75, true),
('T175', 'Флакон T175', 'flask', 35, 175, true),
('T225', 'Флакон T225', 'flask', 45, 225, true),
('CRYO-1ML', 'Криовиала 1 мл', 'cryovial', 1, null, true),
('CRYO-2ML', 'Криовиала 2 мл', 'cryovial', 2, null, true),
('CRYO-5ML', 'Криовиала 5 мл', 'cryovial', 5, null, true),
('P6', 'Планшет 6-лунок', 'plate', 3, 9.6, true),
('P12', 'Планшет 12-лунок', 'plate', 2, 3.8, true),
('P24', 'Планшет 24-лунок', 'plate', 1, 1.9, true),
('BAG-50', 'Культуральный мешок 50 мл', 'bag', 50, null, true),
('BAG-250', 'Культуральный мешок 250 мл', 'bag', 250, null, true),
('BIOREACTOR-1L', 'Биореактор 1 л', 'bioreactor', 1000, null, true);

-- Seed admin user
INSERT INTO users (username, email, full_name, role, is_active) VALUES
('admin', 'admin@bmcp.lab', 'Администратор системы', 'admin', true);

-- Seed basic locations
INSERT INTO locations (location_code, location_name, location_type, is_clean_room, status) VALUES
('ROOM-A', 'Чистая комната A', 'room', true, 'active'),
('ROOM-B', 'Чистая комната B', 'room', true, 'active'),
('STORAGE', 'Склад материалов', 'room', false, 'active');

INSERT INTO locations (location_code, location_name, location_type, parent_location_id, temperature_min, temperature_max, capacity, status)
SELECT 'INC-01', 'Инкубатор CO2 №1', 'incubator', id, 36.5, 37.5, 50, 'active' FROM locations WHERE location_code = 'ROOM-A';

INSERT INTO locations (location_code, location_name, location_type, parent_location_id, temperature_min, temperature_max, capacity, status)
SELECT 'INC-02', 'Инкубатор CO2 №2', 'incubator', id, 36.5, 37.5, 50, 'active' FROM locations WHERE location_code = 'ROOM-A';

INSERT INTO locations (location_code, location_name, location_type, parent_location_id, temperature_min, temperature_max, capacity, status)
SELECT 'FREEZER-80', 'Морозильник -80°C', 'freezer', id, -82, -78, 200, 'active' FROM locations WHERE location_code = 'STORAGE';

INSERT INTO locations (location_code, location_name, location_type, parent_location_id, temperature_min, temperature_max, capacity, status)
SELECT 'FREEZER-LN2', 'Криохранилище LN2', 'freezer', id, -196, -180, 500, 'active' FROM locations WHERE location_code = 'STORAGE';

INSERT INTO locations (location_code, location_name, location_type, parent_location_id, temperature_min, temperature_max, capacity, status)
SELECT 'FRIDGE-01', 'Холодильник +4°C', 'refrigerator', id, 2, 8, 100, 'active' FROM locations WHERE location_code = 'STORAGE';

-- Seed equipment
INSERT INTO equipment (equipment_code, equipment_name, equipment_type, location_id, status, calibration_frequency_days)
SELECT 'INC-01', 'Инкубатор CO2 Thermo Scientific', 'incubator', id, 'operational', 365 FROM locations WHERE location_code = 'INC-01';

INSERT INTO equipment (equipment_code, equipment_name, equipment_type, location_id, status, calibration_frequency_days)
SELECT 'INC-02', 'Инкубатор CO2 Thermo Scientific', 'incubator', id, 'operational', 365 FROM locations WHERE location_code = 'INC-02';

INSERT INTO equipment (equipment_code, equipment_name, equipment_type, status, calibration_frequency_days)
SELECT 'LAM-01', 'Ламинарный бокс класс II', 'laminar_hood', 'operational', 180 FROM locations WHERE location_code = 'ROOM-A' LIMIT 1;

INSERT INTO equipment (equipment_code, equipment_name, equipment_type, status, calibration_frequency_days)
SELECT 'CENT-01', 'Центрифуга Eppendorf', 'centrifuge', 'operational', 365 FROM locations WHERE location_code = 'ROOM-A' LIMIT 1;

INSERT INTO equipment (equipment_code, equipment_name, equipment_type, status, calibration_frequency_days)
SELECT 'MICRO-01', 'Инвертированный микроскоп', 'microscope', 'operational', 365 FROM locations WHERE location_code = 'ROOM-A' LIMIT 1;

-- Seed basic media recipe
INSERT INTO media_recipes (recipe_code, recipe_name, recipe_type, description, shelf_life_days, storage_conditions) VALUES
('RCP-DMEM-FBS-10', 'DMEM + 10% FBS', 'combined', 'Стандартная среда для культивирования MSC', 14, '+2°C до +8°C'),
('RCP-DMEM-FBS-20', 'DMEM + 20% FBS', 'combined', 'Обогащённая среда для примирования', 14, '+2°C до +8°C'),
('RCP-CRYO', 'Криоконсервант', 'combined', 'Среда для заморозки (90% FBS + 10% DMSO)', 30, '+2°C до +8°C');

INSERT INTO media_recipe_components (media_recipe_id, component_name, component_type, quantity_percent, unit) VALUES
((SELECT id FROM media_recipes WHERE recipe_code = 'RCP-DMEM-FBS-10'), 'DMEM', 'base_medium', 89, '%'),
((SELECT id FROM media_recipes WHERE recipe_code = 'RCP-DMEM-FBS-10'), 'FBS', 'serum', 10, '%'),
((SELECT id FROM media_recipes WHERE recipe_code = 'RCP-DMEM-FBS-10'), 'Penicillin/Streptomycin', 'antibiotic', 1, '%');

-- Seed process template: Passage
INSERT INTO process_templates (template_code, name, description, version, applicable_cell_types, estimated_duration_minutes, requires_clean_room) VALUES
('PROC-PASSAGE-V1', 'Пассирование культуры', 'Стандартный процесс пассирования клеточной культуры', 'v1.0', '["MSC", "Fibroblasts"]', 45, true),
('PROC-FREEZING-V1', 'Криоконсервация (MCB/WCB)', 'Процесс заморозки культуры в банк', 'v1.0', '["MSC", "Fibroblasts"]', 60, true),
('PROC-THAWING-V1', 'Размораживание культуры', 'Процесс размораживания из криобанка', 'v1.0', '["MSC", "Fibroblasts"]', 30, true);

-- Steps for Passage process
INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, requires_equipment_scan, required_parameters, cca_rules)
SELECT id, 1, 'Визуальный осмотр', 'observation', 'Осмотрите культуру под микроскопом, оцените конфлюэнтность', false, true, 
'{"confluence": {"type": "number", "unit": "%", "min": 0, "max": 100, "required": true}}', null
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, requires_sop_confirmation)
SELECT id, 2, 'Удаление среды', 'manipulation', 'Аспирируйте старую среду из флакона', false, false
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, required_parameters, cca_rules)
SELECT id, 3, 'Подсчёт клеток', 'measurement', 'Подсчитайте концентрацию и жизнеспособность клеток', true,
'{"cell_count": {"type": "number", "unit": "cells/ml", "required": true}, "viability": {"type": "number", "unit": "%", "min": 0, "max": 100, "required": true}, "volume_ml": {"type": "number", "unit": "ml", "required": true}}',
'{"viability": {"min": 80, "severity": "critical"}, "cell_count": {"min": 500000, "severity": "major"}}'
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical)
SELECT id, 4, 'Центрифугирование', 'manipulation', 'Центрифугируйте суспензию при 300g 5 минут', false
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical)
SELECT id, 5, 'Ресуспендирование', 'manipulation', 'Ресуспендируйте осадок в свежей среде', false
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, required_parameters)
SELECT id, 6, 'Посев в новые флаконы', 'manipulation', 'Распределите суспензию в новые флаконы', false,
'{"split_ratio": {"type": "string", "required": true}, "new_containers_count": {"type": "number", "required": true}}'
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes)
SELECT id, 7, 'Инкубация', 'incubation', 'Поместите флаконы в инкубатор', false, 2880
FROM process_templates WHERE template_code = 'PROC-PASSAGE-V1';;