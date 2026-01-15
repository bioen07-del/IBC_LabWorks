-- ============================================================================
-- МИГРАЦИЯ V1.0.0: Исправление замечаний оператора процесса
-- Дата: 2026-01-14
-- Описание: Внедрение сквозной бизнес-логики, подсчёт клеток пулом, 
--           расчёт плотности посева, связь Dashboard с данными
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ЧАСТЬ 1: STATE MACHINE ДЛЯ ЖИЗНЕННОГО ЦИКЛА КУЛЬТУРЫ
-- ----------------------------------------------------------------------------

-- Enum для состояний lifecycle
CREATE TYPE culture_lifecycle_state AS ENUM (
  'donation_received',
  'isolation_in_progress',
  'P0_active',
  'P1_culturing',
  'P1_active',
  'P2_culturing',
  'P2_active',
  'P3_culturing',
  'P3_active',
  'P4_culturing',
  'P4_active',
  'P5_culturing',
  'P5_active',
  'ready_for_banking',
  'banking_in_progress',
  'master_bank_frozen',
  'thawing_in_progress',
  'working_bank_active',
  'production_in_progress',
  'ready_for_release',
  'qc_testing',
  'released',
  'disposed',
  'contaminated',
  'on_hold'
);

-- Таблица истории переходов
CREATE TABLE culture_lifecycle_states (
  id SERIAL PRIMARY KEY,
  culture_id INTEGER NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
  state culture_lifecycle_state NOT NULL,
  triggered_by_process_id INTEGER REFERENCES executed_processes(id),
  triggered_by_step_id INTEGER REFERENCES executed_steps(id),
  transition_reason TEXT,
  previous_state culture_lifecycle_state,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entered_by_user_id INTEGER REFERENCES users(id),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_cls_culture ON culture_lifecycle_states(culture_id);
CREATE INDEX idx_cls_state ON culture_lifecycle_states(state);
CREATE INDEX idx_cls_entered_at ON culture_lifecycle_states(entered_at DESC);

-- Добавить поле в cultures
ALTER TABLE cultures 
ADD COLUMN current_lifecycle_state culture_lifecycle_state DEFAULT 'donation_received';

-- Инициализировать существующие культуры
UPDATE cultures SET current_lifecycle_state = 
  CASE 
    WHEN status = 'active' AND current_passage = 0 THEN 'P0_active'::culture_lifecycle_state
    WHEN status = 'active' AND current_passage = 1 THEN 'P1_active'::culture_lifecycle_state
    WHEN status = 'active' AND current_passage >= 5 THEN 'ready_for_banking'::culture_lifecycle_state
    WHEN status = 'frozen' THEN 'master_bank_frozen'::culture_lifecycle_state
    ELSE ('P' || current_passage || '_active')::culture_lifecycle_state
  END;

-- Триггер для автоматических переходов
CREATE OR REPLACE FUNCTION trigger_culture_lifecycle_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_culture_id INTEGER;
  v_step_name TEXT;
  v_template_name TEXT;
  v_current_state culture_lifecycle_state;
  v_new_state culture_lifecycle_state;
BEGIN
  SELECT 
    ep.culture_id,
    pts.step_name,
    pt.template_name,
    c.current_lifecycle_state
  INTO v_culture_id, v_step_name, v_template_name, v_current_state
  FROM executed_steps es
  JOIN executed_processes ep ON es.process_id = ep.id
  JOIN process_template_steps pts ON es.template_step_id = pts.id
  JOIN process_templates pt ON pts.template_id = pt.id
  JOIN cultures c ON ep.culture_id = c.id
  WHERE es.id = NEW.id;

  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_new_state := NULL;
    
    -- Правила переходов
    IF v_step_name = 'Посев клеток' AND v_template_name LIKE '%Первичное выделение%' THEN
      v_new_state := 'P0_active';
    ELSIF v_step_name = 'Пересев клеток' THEN
      SELECT ('P' || current_passage || '_active')::culture_lifecycle_state
      INTO v_new_state
      FROM cultures WHERE id = v_culture_id;
    ELSIF v_step_name = 'Заморозка криовиал' THEN
      v_new_state := 'master_bank_frozen';
    END IF;
    
    IF v_new_state IS NOT NULL THEN
      UPDATE cultures SET current_lifecycle_state = v_new_state WHERE id = v_culture_id;
      
      INSERT INTO culture_lifecycle_states (
        culture_id, state, previous_state, 
        triggered_by_process_id, triggered_by_step_id,
        transition_reason, entered_by_user_id
      ) VALUES (
        v_culture_id, v_new_state, v_current_state,
        NEW.process_id, NEW.id,
        format('Завершён шаг "%s"', v_step_name),
        NEW.completed_by_user_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_culture_lifecycle
  AFTER UPDATE ON executed_steps
  FOR EACH ROW 
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION trigger_culture_lifecycle_transition();

-- RLS
ALTER TABLE culture_lifecycle_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all culture_lifecycle_states" ON culture_lifecycle_states
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- ЧАСТЬ 2: ПОДСЧЁТ КЛЕТОК ПУЛОМ
-- ----------------------------------------------------------------------------

CREATE TABLE cell_counting_pools (
  id SERIAL PRIMARY KEY,
  executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,
  source_container_ids INTEGER[] NOT NULL,
  total_volume_ml DECIMAL(10,2) NOT NULL,
  cell_concentration DECIMAL(15,3) NOT NULL,
  viability_percent DECIMAL(5,2) NOT NULL,
  total_cells BIGINT GENERATED ALWAYS AS (
    FLOOR(cell_concentration * total_volume_ml * 1000000)
  ) STORED,
  counting_method VARCHAR(50),
  dilution_factor DECIMAL(10,2) DEFAULT 1.0,
  viability_method VARCHAR(50),
  counted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counted_by_user_id INTEGER REFERENCES users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_ccp_step ON cell_counting_pools(executed_step_id);
CREATE UNIQUE INDEX uq_ccp_one_per_step ON cell_counting_pools(executed_step_id);

ALTER TABLE cell_counting_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all cell_counting_pools" ON cell_counting_pools
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- ЧАСТЬ 3: РАСЧЁТ ПЛОТНОСТИ ПОСЕВА
-- ----------------------------------------------------------------------------

CREATE TABLE container_seeding_plans (
  id SERIAL PRIMARY KEY,
  executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,
  cell_counting_pool_id INTEGER REFERENCES cell_counting_pools(id),
  container_groups JSONB NOT NULL,
  total_area_cm2 DECIMAL(10,2) NOT NULL,
  seeding_density_per_cm2 DECIMAL(15,2) NOT NULL,
  cells_used BIGINT NOT NULL,
  density_status VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id INTEGER REFERENCES users(id)
);

CREATE INDEX idx_csp_step ON container_seeding_plans(executed_step_id);
CREATE UNIQUE INDEX uq_csp_one_per_step ON container_seeding_plans(executed_step_id);

ALTER TABLE container_seeding_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all container_seeding_plans" ON container_seeding_plans
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Функция оценки плотности
CREATE OR REPLACE FUNCTION evaluate_seeding_density(density DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  IF density < 3000 THEN RETURN 'too_sparse';
  ELSIF density < 5000 THEN RETURN 'sparse';
  ELSIF density <= 8000 THEN RETURN 'optimal';
  ELSIF density <= 12000 THEN RETURN 'dense';
  ELSE RETURN 'too_dense';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- КОММЕНТАРИИ
-- ----------------------------------------------------------------------------

COMMENT ON TABLE culture_lifecycle_states IS 
  'История переходов состояний культуры (state machine для сквозной бизнес-логики)';

COMMENT ON TABLE cell_counting_pools IS 
  'Результаты подсчёта ОБЪЕДИНЁННОЙ пробы клеток (биологически корректный подход)';

COMMENT ON TABLE container_seeding_plans IS 
  'Планы посева с расчётом плотности (клеток/см²) и рекомендациями';

-- ============================================================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================================================
