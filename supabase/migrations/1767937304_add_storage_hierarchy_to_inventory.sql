-- Migration: add_storage_hierarchy_to_inventory
-- Created at: 1767937304


ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS equipment_id INTEGER REFERENCES equipment(id),
ADD COLUMN IF NOT EXISTS storage_zone_id INTEGER REFERENCES storage_zones(id);
;