-- Migration: add_clean_room_class_and_storage_zones
-- Created at: 1767936080

-- Добавить класс чистоты в локации
ALTER TABLE locations ADD COLUMN IF NOT EXISTS clean_room_class VARCHAR(20);

-- Создать таблицу зон хранения внутри оборудования
CREATE TABLE IF NOT EXISTS storage_zones (
  id SERIAL PRIMARY KEY,
  zone_code VARCHAR(50) NOT NULL,
  zone_name VARCHAR(255) NOT NULL,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  zone_type VARCHAR(50) NOT NULL DEFAULT 'shelf', -- shelf, rack, drawer, section
  position VARCHAR(100), -- A1, B2, Top, Bottom etc
  temperature_min NUMERIC(6,2),
  temperature_max NUMERIC(6,2),
  capacity INTEGER NOT NULL DEFAULT 100,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, maintenance, full
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска зон по оборудованию
CREATE INDEX IF NOT EXISTS idx_storage_zones_equipment ON storage_zones(equipment_id);

-- Обновить тип локаций - убрать оборудование, оставить только помещения
COMMENT ON COLUMN locations.location_type IS 'Тип локации: room=помещение';;