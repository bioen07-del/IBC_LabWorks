-- Migration: Fix Process Templates and Create Tissue Processing Templates
-- Created at: 2026-01-15
-- Purpose: Remove old templates and create proper templates for tissue processing with correct step_types

-- Delete old templates and their steps (cascade will handle steps)
DELETE FROM process_templates WHERE template_code IN ('PROC-PASSAGE-V1', 'PROC-FREEZING-V1', 'PROC-THAWING-V1');

-- ===================================
-- Template 1: Выделение клеток из костного мозга (Bone Marrow)
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, applicable_tissue_types, applicable_cell_types, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-BM-ISOLATION-V1', 'Выделение клеток из костного мозга', 'Стандартный протокол выделения мононуклеарных клеток из костного мозга методом градиентного центрифугирования', 'v1.0',
'["Bone Marrow"]', '["MSC", "Hematopoietic"]', 180, true, true);

-- Steps for Bone Marrow isolation
INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_equipment_scan, requires_sop_confirmation) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 1, 'Приём образца', 'observation', 'Проверка маркировки образца, целостности контейнера, температуры доставки', false, 5, false, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 2, 'Разведение костного мозга', 'passage', 'Развести костный мозг PBS или физраствором в соотношении 1:1', false, 10, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 3, 'Нанесение на градиент', 'passage', 'Нанести разведенную суспензию на градиент Ficoll-Paque (плотность 1.077 г/мл)', false, 15, false, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 4, 'Центрифугирование', 'passage', 'Центрифугирование при 400g, 30 минут, комнатная температура, без торможения', true, 30, true, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 5, 'Сбор мононуклеаров', 'passage', 'Собрать интерфазу (слой мононуклеарных клеток) пастеровской пипеткой', false, 10, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 6, 'Отмывка клеток', 'passage', 'Трижды отмыть клетки PBS, центрифугируя при 300g по 10 минут', false, 40, false, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 7, 'Подсчёт клеток', 'cell_counting', 'Подсчитать концентрацию и жизнеспособность клеток трипановым синим', true, 10, false, false);

-- CCA rules for critical steps
UPDATE process_template_steps SET cca_rules = '{"min_viability": 80, "expected_viability": 90, "min_concentration": 0.5, "expected_concentration": 2.0}'
WHERE process_template_id = (SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1') AND step_name = 'Подсчёт клеток';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 8, 'Первичный посев', 'passage', 'Посеять клетки в культуральные флаконы с плотностью 10000-20000 кл/см²', false, 20),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BM-ISOLATION-V1'), 9, 'Инкубация', 'observation', 'Поместить флаконы в СО2-инкубатор (37°C, 5% CO2)', false, 1440);

-- ===================================
-- Template 2: Выделение клеток из жировой ткани (Adipose)
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, applicable_tissue_types, applicable_cell_types, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-ADIPOSE-ISOLATION-V1', 'Выделение клеток из жировой ткани', 'Ферментативное выделение стромально-васкулярной фракции (SVF) из жировой ткани', 'v1.0',
'["Adipose"]', '["MSC", "Adipose-derived"]', 240, true, true);

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_sop_confirmation) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 1, 'Приём и осмотр образца', 'observation', 'Проверка качества ткани, отсутствия загрязнений', false, 5, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 2, 'Отмывка ткани', 'passage', 'Многократная отмывка PBS с антибиотиками для удаления крови', false, 15, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 3, 'Измельчение ткани', 'passage', 'Механическое измельчение стерильными ножницами до 2-3 мм фрагментов', false, 20, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 4, 'Ферментативная обработка', 'passage', 'Добавить коллагеназу I типа (1-2 мг/мл), инкубация 60-90 мин при 37°C с встряхиванием', true, 90, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 5, 'Нейтрализация фермента', 'passage', 'Добавить среду с сывороткой для инактивации коллагеназы', false, 5, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 6, 'Центрифугирование', 'passage', 'Центрифугировать при 300g, 10 минут', false, 10, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 7, 'Лизис эритроцитов', 'passage', 'Обработка буфером для лизиса эритроцитов 5-10 минут', false, 15, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 8, 'Фильтрация', 'passage', 'Фильтрация через фильтр 100 мкм и 40 мкм', false, 10, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 9, 'Подсчёт клеток SVF', 'cell_counting', 'Подсчёт концентрации и жизнеспособности клеток', true, 10, false);

UPDATE process_template_steps SET cca_rules = '{"min_viability": 75, "expected_viability": 85, "min_concentration": 1.0, "expected_concentration": 5.0}'
WHERE process_template_id = (SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1') AND step_name = 'Подсчёт клеток SVF';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 10, 'Посев в культуру', 'passage', 'Посев с плотностью 5000-10000 кл/см²', 20),
((SELECT id FROM process_templates WHERE template_code = 'PROC-ADIPOSE-ISOLATION-V1'), 11, 'Инкубация', 'observation', 'Помещение в СО2-инкубатор', 1440);

-- ===================================
-- Template 3: Пассирование культуры
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, applicable_cell_types, is_universal, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-PASSAGE-V2', 'Пассирование клеточной культуры', 'Стандартный протокол субкультивирования адгезивных клеток', 'v2.0',
'["MSC", "Fibroblasts", "Adipose-derived", "Hematopoietic"]', true, 60, true, true);

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_equipment_scan) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 1, 'Визуальный контроль', 'observation', 'Осмотр культуры: конфлюэнтность, отсутствие контаминации', false, 5, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 2, 'Удаление среды', 'passage', 'Аспирация отработанной среды', false, 2, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 3, 'Отмывка PBS', 'passage', 'Промывка клеточного слоя PBS', false, 3, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 4, 'Трипсинизация', 'passage', 'Добавить трипсин-EDTA 0.05-0.25%, инкубация 3-5 мин при 37°C', false, 8, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 5, 'Нейтрализация трипсина', 'passage', 'Добавить среду с FBS для инактивации', false, 2, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 6, 'Центрифугирование', 'passage', 'Центрифугировать при 300g, 5 минут', false, 5, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 7, 'Ресуспендирование', 'passage', 'Ресуспендировать в свежей среде', false, 3, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 8, 'Подсчёт клеток', 'cell_counting', 'Подсчёт концентрации и жизнеспособности', true, 10, false);

UPDATE process_template_steps SET cca_rules = '{"min_viability": 85, "expected_viability": 95, "min_concentration": 0.3, "expected_concentration": 1.0}'
WHERE process_template_id = (SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2') AND step_name = 'Подсчёт клеток';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 9, 'Пересев в новые контейнеры', 'passage', 'Распределение клеток с заданной плотностью посева', 15),
((SELECT id FROM process_templates WHERE template_code = 'PROC-PASSAGE-V2'), 10, 'Инкубация', 'observation', 'Помещение в СО2-инкубатор для прикрепления и роста', 1440);

-- ===================================
-- Template 4: Создание мастер-банка (MCB) или рабочего банка (WCB)
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, is_universal, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-BANKING-V2', 'Криоконсервация - создание клеточного банка', 'Протокол заморозки клеток для создания мастер-банка (MCB) или рабочего банка (WCB)', 'v2.0',
true, 90, true, true);

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 1, 'Проверка культуры', 'observation', 'Визуальный контроль: конфлюэнтность 70-90%, отсутствие контаминации', true, 5),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 2, 'Снятие клеток', 'passage', 'Трипсинизация и сбор клеток', false, 15),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 3, 'Центрифугирование', 'passage', 'Центрифугировать при 300g, 5 минут', false, 5),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 4, 'Подсчёт клеток', 'cell_counting', 'Определить концентрацию и жизнеспособность', true, 10);

UPDATE process_template_steps SET cca_rules = '{"min_viability": 90, "expected_viability": 95, "min_concentration": 0.5, "expected_concentration": 2.0}'
WHERE process_template_id = (SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2') AND step_name = 'Подсчёт клеток';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_sop_confirmation) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 5, 'Подготовка криосреды', 'banking', 'Приготовить среду для заморозки (FBS + DMSO 10% или аналог)', false, 10, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 6, 'Заполнение криовиал', 'banking', 'Расфасовать клеточную суспензию по криовиалам (1-2×10⁶ кл/виала)', true, 20, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 7, 'Контролируемая заморозка', 'banking', 'Заморозка при -1°C/мин до -80°C в контейнере Mr. Frosty', true, 120, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-BANKING-V2'), 8, 'Перенос в LN2', 'banking', 'Перенос криовиал в хранилище жидкого азота -196°C', false, 10, false);

-- ===================================
-- Template 5: Размораживание и активация культуры
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, is_universal, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-THAWING-V2', 'Размораживание клеточной культуры', 'Протокол быстрого размораживания и посева криоконсервированных клеток', 'v2.0',
true, 45, true, true);

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, is_critical, expected_duration_minutes, requires_equipment_scan, requires_sop_confirmation) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 1, 'Извлечение криовиалы', 'observation', 'Извлечь криовиалу из LN2, проверить маркировку', false, 2, false, true),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 2, 'Быстрое размораживание', 'passage', 'Разморозить в водяной бане 37°C в течение 2-3 минут', true, 3, true, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 3, 'Перенос в пробирку', 'passage', 'Осторожно перенести суспензию в пробирку со средой', false, 2, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 4, 'Центрифугирование', 'passage', 'Центрифугировать при 300g, 5 минут для удаления DMSO', false, 5, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 5, 'Ресуспендирование', 'passage', 'Ресуспендировать осадок в свежей тёплой среде', false, 3, false),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 6, 'Подсчёт клеток post-thaw', 'cell_counting', 'Определить жизнеспособность после размораживания', true, 10, false);

UPDATE process_template_steps SET cca_rules = '{"min_viability": 70, "expected_viability": 80}'
WHERE process_template_id = (SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2') AND step_name = 'Подсчёт клеток post-thaw';

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 7, 'Посев', 'passage', 'Посеять клетки во флаконы с предварительно прогретой средой', 10),
((SELECT id FROM process_templates WHERE template_code = 'PROC-THAWING-V2'), 8, 'Инкубация', 'observation', 'Инкубация 24-48 ч до первой смены среды', 1440);

-- ===================================
-- Template 6: Смена среды
-- ===================================
INSERT INTO process_templates (template_code, name, description, version, is_universal, estimated_duration_minutes, requires_clean_room, is_active) VALUES
('PROC-MEDIA-CHANGE-V1', 'Смена культуральной среды', 'Рутинная замена отработанной среды на свежую', 'v1.0',
true, 15, true, true);

INSERT INTO process_template_steps (process_template_id, step_number, step_name, step_type, description, expected_duration_minutes) VALUES
((SELECT id FROM process_templates WHERE template_code = 'PROC-MEDIA-CHANGE-V1'), 1, 'Визуальный контроль', 'observation', 'Проверка культуры под микроскопом', 3),
((SELECT id FROM process_templates WHERE template_code = 'PROC-MEDIA-CHANGE-V1'), 2, 'Удаление старой среды', 'media_change', 'Аспирация отработанной среды', 2),
((SELECT id FROM process_templates WHERE template_code = 'PROC-MEDIA-CHANGE-V1'), 3, 'Добавление свежей среды', 'media_change', 'Внесение предварительно прогретой свежей среды', 5),
((SELECT id FROM process_templates WHERE template_code = 'PROC-MEDIA-CHANGE-V1'), 4, 'Возврат в инкубатор', 'observation', 'Помещение контейнеров обратно в СО2-инкубатор', 5);

-- Add default notification on completion
COMMENT ON TABLE process_templates IS 'Process templates now include proper step_types: passage, cell_counting, media_change, banking, observation';
