-- ЗАДАЧА 2: Таблица observations для ежедневных наблюдений за культурами
-- ТЗ раздел 3.3.7: "Operator может ежедневно записывать наблюдения за культурой"

CREATE TABLE IF NOT EXISTS observations (
    id SERIAL PRIMARY KEY,
    culture_id INTEGER NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    container_id INTEGER REFERENCES containers(id) ON DELETE SET NULL,
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    confluence_percent INTEGER CHECK (confluence_percent BETWEEN 0 AND 100),
    morphology_description TEXT,
    contamination_detected BOOLEAN DEFAULT FALSE,
    contamination_type VARCHAR(50),  -- bacterial, fungal, mycoplasma, unknown
    notes TEXT,
    images JSONB DEFAULT '[]',  -- [{url: "...", description: ""}]
    recorded_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS ix_observations_culture ON observations(culture_id);
CREATE INDEX IF NOT EXISTS ix_observations_date ON observations(observation_date);
CREATE INDEX IF NOT EXISTS ix_observations_contamination ON observations(contamination_detected) WHERE contamination_detected = TRUE;

-- RLS
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read observations" ON observations
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert observations" ON observations
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update observations" ON observations
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_observations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_observations_updated_at ON observations;
CREATE TRIGGER trg_observations_updated_at
    BEFORE UPDATE ON observations
    FOR EACH ROW EXECUTE FUNCTION update_observations_updated_at();

COMMENT ON TABLE observations IS 'Ежедневные наблюдения за культурами (ТЗ 3.3.7)';

-- ЗАДАЧА 3: Добавить поля для привязки типа клеток к процессу
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS initial_process_template_id INTEGER REFERENCES process_templates(id);

-- ЗАДАЧА 4: Добавить специфичные реагенты
INSERT INTO reagents (reagent_code, name, category, unit, is_active) VALUES
    -- Для фибробластов
    ('RG-COLL-1', 'Collagenase Type I', 'enzyme', 'mg', true),
    ('RG-DISP-1', 'Dispase II', 'enzyme', 'mg', true),
    ('RG-FIBM-1', 'Fibroblast Growth Medium', 'media', 'ml', true),
    -- Для макрофагов
    ('RG-FICO-1', 'Ficoll-Paque PLUS', 'reagent', 'ml', true),
    ('RG-MCSF-1', 'M-CSF (Macrophage Colony-Stimulating Factor)', 'cytokine', 'ng', true),
    ('RG-LPS-1', 'LPS (Lipopolysaccharide)', 'stimulant', 'ng', true),
    ('RG-RPMI-1', 'RPMI-1640', 'media', 'ml', true),
    -- Для МСК
    ('RG-AMEM-1', 'α-MEM', 'media', 'ml', true),
    ('RG-DEX-1', 'Dexamethasone', 'supplement', 'µM', true),
    ('RG-ASC-1', 'Ascorbic Acid', 'supplement', 'mg', true),
    ('RG-BGLY-1', 'β-Glycerophosphate', 'supplement', 'mM', true),
    ('RG-BSA-1', 'BSA (Bovine Serum Albumin)', 'protein', 'mg', true)
ON CONFLICT (reagent_code) DO NOTHING;

-- ЗАДАЧА 3: Добавить специфичные шаблоны процессов
INSERT INTO process_templates (template_code, name, description, category, is_active, tissue_types, cell_types) VALUES
    ('PT-FIB-ISO', 'Fibroblast Isolation from Skin Biopsy', 
     'Выделение фибробластов из биоптата кожи с ферментативной обработкой',
     'isolation', true, '["skin_biopsy"]'::jsonb, '["fibroblast"]'::jsonb),
    ('PT-MAC-ISO', 'Macrophage Isolation from Cord Blood',
     'Выделение макрофагов из пуповинной крови через моноциты (градиент Фиколла)',
     'isolation', true, '["cord_blood", "peripheral_blood"]'::jsonb, '["macrophage"]'::jsonb),
    ('PT-MSC-ISO', 'MSC Isolation from Adipose Tissue',
     'Выделение мезенхимальных стволовых клеток из жировой ткани (липоаспират)',
     'isolation', true, '["adipose_tissue", "bone_marrow", "dental_pulp"]'::jsonb, '["msc"]'::jsonb)
ON CONFLICT (template_code) DO NOTHING;

-- Добавить шаги для Fibroblast Isolation (PT-FIB-ISO)
INSERT INTO process_template_steps (process_template_id, step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
SELECT pt.id, steps.step_order, steps.step_name, steps.step_type, steps.instructions, steps.is_critical, steps.duration_minutes, steps.equipment_required, steps.parameters_to_record, steps.cca_rules
FROM process_templates pt
CROSS JOIN (VALUES
    (1, 'Приём биоптата', 'reception', 'Проверка целостности образца, регистрация в системе', false, 15, '["BSC"]', '["biopsy_size_mm", "time_from_collection_hours"]', '{"time_from_collection_hours": {"max": 24, "severity": "critical"}}'),
    (2, 'Механическое измельчение', 'processing', 'Измельчить биоптат стерильными ножницами до фрагментов ~1-2 мм', false, 30, '["BSC", "Sterile Scissors"]', '["fragment_count"]', NULL),
    (3, 'Ферментативная обработка', 'digestion', 'Обработка коллагеназой/диспазой для разделения клеток (37°C, 3ч)', true, 180, '["Incubator", "Shaker"]', '["enzyme_concentration_mg_ml", "incubation_temp_celsius", "incubation_duration_minutes"]', '{"incubation_temp_celsius": {"min": 36, "max": 38, "severity": "critical"}}'),
    (4, 'Центрифугирование', 'centrifugation', 'Осаждение клеток при 300-500 RPM', true, 15, '["Centrifuge"]', '["rpm", "duration_minutes", "temperature_celsius"]', '{"rpm": {"min": 300, "max": 500, "severity": "critical"}}'),
    (5, 'Ресуспендирование и посев', 'seeding', 'Ресуспендировать в фибробластной среде, посеять в культуральные флаконы', true, 30, '["BSC", "Hemocytometer"]', '["cell_count_total", "viability_percent", "seeding_density_cells_per_cm2"]', '{"viability_percent": {"min": 70, "severity": "critical"}}'),
    (6, 'Первичная инкубация', 'incubation', 'Инкубировать при 37°C, 5% CO₂ до 70-80% конфлюэнтности (7 дней)', false, 10080, '["Incubator"]', '["confluence_at_day_7"]', NULL)
) AS steps(step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
WHERE pt.template_code = 'PT-FIB-ISO'
ON CONFLICT DO NOTHING;

-- Добавить шаги для Macrophage Isolation (PT-MAC-ISO)
INSERT INTO process_template_steps (process_template_id, step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
SELECT pt.id, steps.step_order, steps.step_name, steps.step_type, steps.instructions, steps.is_critical, steps.duration_minutes, steps.equipment_required, steps.parameters_to_record, steps.cca_rules
FROM process_templates pt
CROSS JOIN (VALUES
    (1, 'Приём крови', 'reception', 'Проверка объёма крови, регистрация донора', true, 15, '["BSC"]', '["blood_volume_ml", "collection_time"]', '{"blood_volume_ml": {"min": 50, "severity": "critical"}}'),
    (2, 'Градиент Фиколла', 'separation', 'Разделение на градиенте Фиколла для выделения мононуклеарных клеток', true, 60, '["Centrifuge", "BSC"]', '["ficoll_volume_ml", "centrifuge_speed_rpm", "centrifuge_time_minutes"]', '{"centrifuge_speed_rpm": {"min": 400, "max": 600, "severity": "critical"}}'),
    (3, 'Сбор интерфазы', 'collection', 'Собрать слой мононуклеарных клеток', false, 15, '["BSC", "Pipette"]', '["interface_volume_ml"]', NULL),
    (4, 'Промывка и подсчёт', 'washing', 'Промыть PBS, подсчитать клетки', true, 30, '["Centrifuge", "Hemocytometer"]', '["cell_count_total", "viability_percent"]', '{"viability_percent": {"min": 90, "severity": "critical"}}'),
    (5, 'Адгезия моноцитов', 'adhesion', 'Посев в чашки для адгезии моноцитов (2-3 часа)', true, 180, '["Incubator", "Cell Culture Dishes"]', '["seeding_density_cells_per_cm2", "adhesion_time_minutes"]', NULL),
    (6, 'Удаление неадгезированных', 'washing', 'Смыть лимфоциты и неадгезированные клетки', false, 15, '["BSC"]', NULL, NULL),
    (7, 'Дифференцировка', 'differentiation', 'Культивирование с M-CSF 7 дней для дифференцировки в макрофаги', true, 10080, '["Incubator"]', '["m_csf_concentration_ng_ml", "differentiation_duration_days"]', '{"m_csf_concentration_ng_ml": {"min": 50, "max": 100, "severity": "critical"}}')
) AS steps(step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
WHERE pt.template_code = 'PT-MAC-ISO'
ON CONFLICT DO NOTHING;

-- Добавить шаги для MSC Isolation (PT-MSC-ISO)
INSERT INTO process_template_steps (process_template_id, step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
SELECT pt.id, steps.step_order, steps.step_name, steps.step_type, steps.instructions, steps.is_critical, steps.duration_minutes, steps.equipment_required, steps.parameters_to_record, steps.cca_rules
FROM process_templates pt
CROSS JOIN (VALUES
    (1, 'Приём липоаспирата', 'reception', 'Проверка объёма ткани, регистрация донора', true, 15, '["BSC"]', '["tissue_volume_ml", "collection_time"]', '{"tissue_volume_ml": {"min": 10, "severity": "critical"}}'),
    (2, 'Промывка ткани', 'washing', 'Промыть PBS для удаления крови и анестетиков', false, 30, '["BSC", "Centrifuge"]', '["wash_cycles"]', NULL),
    (3, 'Ферментативное переваривание', 'digestion', 'Обработка коллагеназой для высвобождения клеток (37°C, 60-90 мин)', true, 90, '["Incubator", "Shaker"]', '["collagenase_concentration_mg_ml", "digestion_temp_celsius", "digestion_duration_minutes"]', '{"digestion_temp_celsius": {"min": 36, "max": 38, "severity": "critical"}}'),
    (4, 'Центрифугирование и фильтрация', 'centrifugation', 'Осадить клетки, отфильтровать через 70 мкм фильтр', true, 30, '["Centrifuge", "Cell Strainer 70µm"]', '["rpm", "duration_minutes"]', '{"rpm": {"min": 300, "max": 500, "severity": "critical"}}'),
    (5, 'Ресуспендирование и посев', 'seeding', 'Ресуспендировать в α-MEM + FBS, посеять в культуральные флаконы', true, 30, '["BSC", "Hemocytometer"]', '["cell_count_total", "viability_percent", "seeding_density_cells_per_cm2"]', '{"viability_percent": {"min": 80, "severity": "critical"}}'),
    (6, 'Первичная экспансия', 'incubation', 'Культивирование до 70-80% конфлюэнтности (7-10 дней). Замена среды каждые 3 дня.', false, 14400, '["Incubator"]', '["confluence_at_day_10"]', NULL)
) AS steps(step_order, step_name, step_type, instructions, is_critical, duration_minutes, equipment_required, parameters_to_record, cca_rules)
WHERE pt.template_code = 'PT-MSC-ISO'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE observations IS 'Ежедневные наблюдения за культурами (ТЗ 3.3.7)';
