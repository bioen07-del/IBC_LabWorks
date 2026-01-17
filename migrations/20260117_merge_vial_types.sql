-- ========================================
-- МИГРАЦИЯ: Объединение vial_types в container_types
-- Дата: 2026-01-17
-- Описание: Объединяет специализированную таблицу vial_types в общий справочник container_types,
--           обновляет frozen_vials для использования container_type_id
-- ========================================

BEGIN;

-- ШАГ 1: Расширение container_types полями из vial_types
-- ---------------------------------------------------------
ALTER TABLE container_types
  ADD COLUMN IF NOT EXISTS material VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cap_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sterile BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS suitable_for_ln2 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suitable_for_vapor BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suitable_for_minus80 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_temperature_c NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS min_temperature_c NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS barcode_compatible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Добавить индексы для производительности
CREATE INDEX IF NOT EXISTS idx_container_types_suitable_ln2
  ON container_types(suitable_for_ln2) WHERE suitable_for_ln2 = true;

CREATE INDEX IF NOT EXISTS idx_container_types_material
  ON container_types(material) WHERE material IS NOT NULL;

-- Комментарии
COMMENT ON COLUMN container_types.material IS 'Материал контейнера (polypropylene, glass, PETG, EVA/PETG)';
COMMENT ON COLUMN container_types.cap_type IS 'Тип крышки (screw, snap, cork, port)';
COMMENT ON COLUMN container_types.sterile IS 'Стерильность контейнера';
COMMENT ON COLUMN container_types.suitable_for_ln2 IS 'Подходит для хранения в жидком азоте (-196°C)';
COMMENT ON COLUMN container_types.suitable_for_vapor IS 'Подходит для хранения в парах LN2 (-150°C)';
COMMENT ON COLUMN container_types.suitable_for_minus80 IS 'Подходит для хранения при -80°C';
COMMENT ON COLUMN container_types.max_temperature_c IS 'Максимальная температура хранения (°C)';
COMMENT ON COLUMN container_types.min_temperature_c IS 'Минимальная температура хранения (°C)';
COMMENT ON COLUMN container_types.barcode_compatible IS 'Совместимость с баркодами';

DO $$ BEGIN
  RAISE NOTICE '✅ Шаг 1: container_types расширен новыми полями';
END $$;

-- ШАГ 2: Миграция данных из vial_types в container_types
-- ---------------------------------------------------------
-- Создать временную таблицу для сопоставления ID
CREATE TEMP TABLE vial_to_container_mapping (
  old_vial_type_id INTEGER,
  new_container_type_id INTEGER
);

DO $$ BEGIN
  RAISE NOTICE 'Миграция данных из vial_types в container_types...';
END $$;

-- Вставить данные из vial_types в container_types
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Вставка новых типов виал
  WITH inserted_rows AS (
    INSERT INTO container_types (
      type_code,
      type_name,
      category,
      manufacturer,
      catalog_number,
      volume_ml,
      material,
      cap_type,
      sterile,
      suitable_for_ln2,
      suitable_for_vapor,
      suitable_for_minus80,
      max_temperature_c,
      min_temperature_c,
      barcode_compatible,
      notes,
      is_active
    )
    SELECT
      vt.type_code,
      vt.type_name,
      CASE
        WHEN vt.category = 'cryobag' THEN 'bag'::container_category
        WHEN vt.category = 'tube' THEN 'cryovial'::container_category
        ELSE vt.category::text::container_category
      END as category,
      vt.manufacturer,
      vt.catalog_number,
      vt.volume_ml,
      vt.material,
      vt.cap_type,
      vt.sterile,
      vt.suitable_for_ln2,
      vt.suitable_for_vapor,
      vt.suitable_for_minus80,
      vt.max_temperature_c,
      vt.min_temperature_c,
      vt.barcode_compatible,
      vt.notes,
      vt.is_active
    FROM vial_types vt
    WHERE NOT EXISTS (
      SELECT 1 FROM container_types ct
      WHERE ct.type_code = vt.type_code
    )
    RETURNING id, type_code
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted_rows;

  RAISE NOTICE '  ✅ Перенесено % записей из vial_types в container_types', inserted_count;
END $$;

-- Заполнить маппинг старых и новых ID
INSERT INTO vial_to_container_mapping (old_vial_type_id, new_container_type_id)
SELECT vt.id, ct.id
FROM vial_types vt
JOIN container_types ct ON ct.type_code = vt.type_code;

DO $$
DECLARE
  mapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM vial_to_container_mapping;
  RAISE NOTICE '  ✅ Создан маппинг ID: % записей', mapping_count;
END $$;

-- ШАГ 3: Обновление frozen_vials
-- ---------------------------------------------------------
DO $$ BEGIN
  RAISE NOTICE 'Обновление frozen_vials...';
END $$;

-- Добавить новую колонку container_type_id
ALTER TABLE frozen_vials
  ADD COLUMN IF NOT EXISTS container_type_id INTEGER REFERENCES container_types(id);

-- Мигрировать данные из vial_type_id в container_type_id
UPDATE frozen_vials fv
SET container_type_id = m.new_container_type_id
FROM vial_to_container_mapping m
WHERE fv.vial_type_id = m.old_vial_type_id;

-- Проверка: все ли записи мигрировали
DO $$
DECLARE
  total_count INTEGER;
  migrated_count INTEGER;
  unmigrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM frozen_vials;
  SELECT COUNT(*) INTO migrated_count FROM frozen_vials WHERE container_type_id IS NOT NULL;
  SELECT COUNT(*) INTO unmigrated_count FROM frozen_vials WHERE container_type_id IS NULL;

  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Миграция не завершена: % из % записей frozen_vials не мигрировали', unmigrated_count, total_count;
  END IF;

  RAISE NOTICE '  ✅ Все % записей frozen_vials успешно мигрировали', total_count;
END $$;

-- Сделать container_type_id обязательным
ALTER TABLE frozen_vials
  ALTER COLUMN container_type_id SET NOT NULL;

-- Создать индекс
CREATE INDEX IF NOT EXISTS idx_frozen_vials_container_type
  ON frozen_vials(container_type_id);

COMMENT ON COLUMN frozen_vials.container_type_id IS 'Ссылка на тип контейнера (криовиалы) из container_types';

-- Удалить старую колонку vial_type_id
ALTER TABLE frozen_vials
  DROP COLUMN IF EXISTS vial_type_id;

DO $$ BEGIN
  RAISE NOTICE '  ✅ frozen_vials обновлена: vial_type_id → container_type_id';
END $$;

-- ШАГ 4: Удаление таблицы vial_types
-- ---------------------------------------------------------
DO $$ BEGIN
  RAISE NOTICE 'Удаление таблицы vial_types...';
END $$;

-- Удалить политики RLS
DROP POLICY IF EXISTS "Allow read vial_types for authenticated" ON vial_types;
DROP POLICY IF EXISTS "Allow insert vial_types for authenticated" ON vial_types;
DROP POLICY IF EXISTS "Allow update vial_types for authenticated" ON vial_types;
DROP POLICY IF EXISTS "Allow delete vial_types for authenticated" ON vial_types;
DROP POLICY IF EXISTS "Allow all for authenticated" ON vial_types;

-- Удалить триггеры
DROP TRIGGER IF EXISTS update_vial_types_updated_at ON vial_types;

-- Удалить таблицу
DROP TABLE IF EXISTS vial_types CASCADE;

DO $$ BEGIN
  RAISE NOTICE '  ✅ Таблица vial_types удалена';
END $$;

-- ШАГ 5: Проверка container_type_id в inventory_items
-- ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'container_type_id'
  ) THEN
    ALTER TABLE inventory_items
      ADD COLUMN container_type_id INTEGER REFERENCES container_types(id);

    CREATE INDEX idx_inventory_items_container_type
      ON inventory_items(container_type_id);

    COMMENT ON COLUMN inventory_items.container_type_id IS 'Ссылка на тип контейнера (для виал и расходников)';

    RAISE NOTICE '✅ Добавлено поле container_type_id в inventory_items';
  ELSE
    RAISE NOTICE '✅ Поле container_type_id уже существует в inventory_items';
  END IF;
END $$;

-- ШАГ 6: Обновление RLS политик для container_types
-- ---------------------------------------------------------
-- Убедиться что политики разрешают чтение всех типов контейнеров
DROP POLICY IF EXISTS "Allow read container_types for authenticated" ON container_types;
CREATE POLICY "Allow read container_types for authenticated"
  ON container_types FOR SELECT
  TO authenticated
  USING (true);

DO $$ BEGIN
  RAISE NOTICE '✅ RLS политики для container_types обновлены';
END $$;

-- ШАГ 7: Финальные проверки и отчет
-- ---------------------------------------------------------
DO $$
DECLARE
  ct_cryovial_count INTEGER;
  fv_count INTEGER;
  ii_with_ct_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ct_cryovial_count
  FROM container_types WHERE category = 'cryovial';

  SELECT COUNT(*) INTO fv_count
  FROM frozen_vials;

  SELECT COUNT(*) INTO ii_with_ct_count
  FROM inventory_items WHERE container_type_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'РЕЗУЛЬТАТЫ МИГРАЦИИ:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Таблица vial_types удалена';
  RAISE NOTICE '✅ Данные перенесены в container_types';
  RAISE NOTICE '✅ Криовиалы в container_types: %', ct_cryovial_count;
  RAISE NOTICE '✅ frozen_vials обновлены: % записей', fv_count;
  RAISE NOTICE '✅ frozen_vials.vial_type_id → container_type_id';
  RAISE NOTICE '✅ inventory_items с container_type_id: %', ii_with_ct_count;
  RAISE NOTICE '';
  RAISE NOTICE 'СЛЕДУЮЩИЕ ШАГИ:';
  RAISE NOTICE '1. Удалить src/pages/VialTypes.tsx';
  RAISE NOTICE '2. Обновить src/components/culture-actions/BankingFormModal.tsx';
  RAISE NOTICE '3. Расширить src/pages/Inventory.tsx';
  RAISE NOTICE '4. Обновить src/lib/database.types.ts';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
