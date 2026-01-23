-- =====================================================
-- FILL DICTIONARIES FOR TESTING
-- Version: 1.0
-- Date: 2026-01-23
-- Description: Populate all reference/dictionary tables with realistic test data
-- =====================================================

-- ==================== CONTAINER TYPES ====================
INSERT INTO container_types (
  type_code, type_name, category, volume_ml, surface_area_cm2,
  manufacturer, catalog_number, sterile, suitable_for_ln2, suitable_for_minus80,
  suitable_for_vapor, max_temperature_c, min_temperature_c, barcode_compatible, is_active
) VALUES
-- Flask types
('T25', 'T25 Flask', 'flask', 25, 25, 'Corning', '430639', true, false, false, false, 37, 4, true, true),
('T75', 'T75 Flask', 'flask', 75, 75, 'Corning', '430725U', true, false, false, false, 37, 4, true, true),
('T175', 'T175 Flask', 'flask', 175, 175, 'Corning', '431080', true, false, false, false, 37, 4, true, true),
('T225', 'T225 Flask', 'flask', 225, 225, 'Corning', '431082', true, false, false, false, 37, 4, true, true),

-- Plate types
('P6W', '6-Well Plate', 'plate', 15, 9.6, 'Corning', '3506', true, false, false, false, 37, 4, true, true),
('P12W', '12-Well Plate', 'plate', 10, 3.8, 'Corning', '3512', true, false, false, false, 37, 4, true, true),
('P24W', '24-Well Plate', 'plate', 5, 1.9, 'Corning', '3524', true, false, false, false, 37, 4, true, true),
('P96W', '96-Well Plate', 'plate', 2, 0.32, 'Corning', '3596', true, false, false, false, 37, 4, true, true),

-- Bag types
('BAG250', '250ml Cell Culture Bag', 'bag', 250, 100, 'Origen Biomedical', 'CB250', true, false, true, false, 37, -80, true, true),
('BAG500', '500ml Cell Culture Bag', 'bag', 500, 200, 'Origen Biomedical', 'CB500', true, false, true, false, 37, -80, true, true),
('BAG1000', '1000ml Cell Culture Bag', 'bag', 1000, 400, 'Origen Biomedical', 'CB1000', true, false, true, false, 37, -80, true, true),

-- Bioreactor types
('BIOREAC500', '500ml Bioreactor', 'bioreactor', 500, NULL, 'Sartorius', 'BIOSTAT-500', true, false, false, false, 37, 4, true, true),
('BIOREAC2L', '2L Bioreactor', 'bioreactor', 2000, NULL, 'Sartorius', 'BIOSTAT-2L', true, false, false, false, 37, 4, true, true)
ON CONFLICT (type_code) DO NOTHING;

-- ==================== VIAL TYPES ====================
INSERT INTO vial_types (
  type_code, type_name, category, manufacturer, catalog_number, volume_ml,
  material, cap_type, sterile, suitable_for_ln2, suitable_for_vapor, suitable_for_minus80,
  max_temperature_c, min_temperature_c, barcode_compatible, is_active
) VALUES
-- Cryovials
('CRYO1ML', '1ml Cryovial', 'cryovial', 'Nunc', '375353', 1.0, 'Polypropylene', 'External Thread', true, true, true, true, 121, -196, true, true),
('CRYO2ML', '2ml Cryovial', 'cryovial', 'Nunc', '375418', 2.0, 'Polypropylene', 'External Thread', true, true, true, true, 121, -196, true, true),
('CRYO5ML', '5ml Cryovial', 'cryovial', 'Nunc', '377267', 5.0, 'Polypropylene', 'External Thread', true, true, true, true, 121, -196, true, true),

-- Tubes
('TUBE15ML', '15ml Conical Tube', 'tube', 'Corning', '430052', 15.0, 'Polypropylene', 'Screw Cap', true, false, false, true, 121, -80, true, true),
('TUBE50ML', '50ml Conical Tube', 'tube', 'Corning', '430829', 50.0, 'Polypropylene', 'Screw Cap', true, false, false, true, 121, -80, true, true)
ON CONFLICT (type_code) DO NOTHING;

-- ==================== LOCATIONS ====================
INSERT INTO locations (
  location_code, location_name, location_type, parent_location_id,
  temperature_min, temperature_max, capacity, current_occupancy,
  is_clean_room, clean_room_class, status
) VALUES
-- Clean rooms
('CR-A', 'Clean Room A', 'room', NULL, 18, 25, 100, 0, true, 'ISO7', 'active'),
('CR-B', 'Clean Room B', 'room', NULL, 18, 25, 100, 0, true, 'ISO8', 'active'),

-- Incubators in Clean Room A
('INC-01', 'Incubator 01 (CO2)', 'incubator', (SELECT id FROM locations WHERE location_code = 'CR-A'), 36.5, 37.5, 50, 0, false, NULL, 'active'),
('INC-02', 'Incubator 02 (CO2)', 'incubator', (SELECT id FROM locations WHERE location_code = 'CR-A'), 36.5, 37.5, 50, 0, false, NULL, 'active'),

-- Freezers
('FRZ-80-01', 'Freezer -80C #01', 'freezer', NULL, -82, -78, 1000, 0, false, NULL, 'active'),
('FRZ-80-02', 'Freezer -80C #02', 'freezer', NULL, -82, -78, 1000, 0, false, NULL, 'active'),
('FRZ-LN2-01', 'Liquid Nitrogen Storage #01', 'freezer', NULL, -196, -180, 5000, 0, false, NULL, 'active'),
('FRZ-LN2-02', 'Liquid Nitrogen Storage #02', 'freezer', NULL, -196, -180, 5000, 0, false, NULL, 'active'),

-- Refrigerators
('REF-01', 'Refrigerator 4C #01', 'refrigerator', NULL, 2, 8, 200, 0, false, NULL, 'active'),
('REF-02', 'Refrigerator 4C #02', 'refrigerator', NULL, 2, 8, 200, 0, false, NULL, 'active')
ON CONFLICT (location_code) DO NOTHING;

-- ==================== EQUIPMENT ====================
INSERT INTO equipment (
  equipment_code, equipment_name, equipment_type, serial_number, manufacturer, model,
  location_id, status, last_calibration_date, calibration_frequency_days,
  calibration_valid_until
) VALUES
('EQ-INC-01', 'CO2 Incubator #1', 'incubator', 'INC-2024-001', 'Thermo Scientific', 'HERAcell 150i', (SELECT id FROM locations WHERE location_code = 'INC-01'), 'operational', CURRENT_DATE - INTERVAL '30 days', 90, CURRENT_DATE + INTERVAL '60 days'),
('EQ-INC-02', 'CO2 Incubator #2', 'incubator', 'INC-2024-002', 'Thermo Scientific', 'HERAcell 150i', (SELECT id FROM locations WHERE location_code = 'INC-02'), 'operational', CURRENT_DATE - INTERVAL '30 days', 90, CURRENT_DATE + INTERVAL '60 days'),
('EQ-LAM-01', 'Laminar Flow Hood #1', 'laminar_hood', 'LAM-2024-001', 'Esco', 'Streamline SC2', (SELECT id FROM locations WHERE location_code = 'CR-A'), 'operational', CURRENT_DATE - INTERVAL '60 days', 180, CURRENT_DATE + INTERVAL '120 days'),
('EQ-LAM-02', 'Laminar Flow Hood #2', 'laminar_hood', 'LAM-2024-002', 'Esco', 'Streamline SC2', (SELECT id FROM locations WHERE location_code = 'CR-B'), 'operational', CURRENT_DATE - INTERVAL '60 days', 180, CURRENT_DATE + INTERVAL '120 days'),
('EQ-CENT-01', 'Centrifuge #1', 'centrifuge', 'CENT-2024-001', 'Eppendorf', '5810 R', (SELECT id FROM locations WHERE location_code = 'CR-A'), 'operational', CURRENT_DATE - INTERVAL '90 days', 180, CURRENT_DATE + INTERVAL '90 days'),
('EQ-MICRO-01', 'Microscope #1', 'microscope', 'MICRO-2024-001', 'Olympus', 'CKX53', (SELECT id FROM locations WHERE location_code = 'CR-A'), 'operational', CURRENT_DATE - INTERVAL '120 days', 365, CURRENT_DATE + INTERVAL '245 days'),
('EQ-FRZ-01', '-80C Freezer #1', 'freezer', 'FRZ-2024-001', 'Thermo Scientific', 'TSX Series', (SELECT id FROM locations WHERE location_code = 'FRZ-80-01'), 'operational', CURRENT_DATE - INTERVAL '180 days', 365, CURRENT_DATE + INTERVAL '185 days'),
('EQ-FRZ-02', '-80C Freezer #2', 'freezer', 'FRZ-2024-002', 'Thermo Scientific', 'TSX Series', (SELECT id FROM locations WHERE location_code = 'FRZ-80-02'), 'operational', CURRENT_DATE - INTERVAL '180 days', 365, CURRENT_DATE + INTERVAL '185 days')
ON CONFLICT (equipment_code) DO NOTHING;

-- ==================== STORAGE ZONES ====================
INSERT INTO storage_zones (
  zone_code, zone_name, equipment_id, zone_type, position,
  temperature_min, temperature_max, capacity, current_occupancy, status
) VALUES
-- Zones for -80C Freezer #1
('FRZ-80-01-S1', 'Freezer -80C #1 - Shelf 1', (SELECT id FROM equipment WHERE equipment_code = 'EQ-FRZ-01'), 'shelf', 1, -82, -78, 100, 0, 'active'),
('FRZ-80-01-S2', 'Freezer -80C #1 - Shelf 2', (SELECT id FROM equipment WHERE equipment_code = 'EQ-FRZ-01'), 'shelf', 2, -82, -78, 100, 0, 'active'),
('FRZ-80-01-S3', 'Freezer -80C #1 - Shelf 3', (SELECT id FROM equipment WHERE equipment_code = 'EQ-FRZ-01'), 'shelf', 3, -82, -78, 100, 0, 'active'),

-- Zones for -80C Freezer #2
('FRZ-80-02-S1', 'Freezer -80C #2 - Shelf 1', (SELECT id FROM equipment WHERE equipment_code = 'EQ-FRZ-02'), 'shelf', 1, -82, -78, 100, 0, 'active'),
('FRZ-80-02-S2', 'Freezer -80C #2 - Shelf 2', (SELECT id FROM equipment WHERE equipment_code = 'EQ-FRZ-02'), 'shelf', 2, -82, -78, 100, 0, 'active')
ON CONFLICT (zone_code) DO NOTHING;

-- ==================== MEDIA RECIPES ====================
INSERT INTO media_recipes (
  recipe_code, recipe_name, recipe_type, description,
  is_active, preparation_sop_reference, shelf_life_days, storage_conditions
) VALUES
-- Base media
('DMEM-BASE', 'DMEM Base Medium', 'base', 'Dulbecco''s Modified Eagle Medium - base formulation', true, 'SOP-MED-001', 180, 'Store at 4°C, protect from light'),
('ALPHA-MEM-BASE', 'Alpha-MEM Base', 'base', 'Alpha Minimum Essential Medium - base formulation', true, 'SOP-MED-001', 180, 'Store at 4°C, protect from light'),
('RPMI-BASE', 'RPMI 1640 Base', 'base', 'RPMI 1640 Medium - base formulation', true, 'SOP-MED-001', 180, 'Store at 4°C, protect from light'),

-- Combined media for MSCs
('MSC-GROWTH', 'MSC Growth Medium', 'combined', 'Complete growth medium for Mesenchymal Stem Cells', true, 'SOP-MED-002', 14, 'Store at 4°C, protect from light, use within 2 weeks'),
('MSC-FREEZE', 'MSC Freezing Medium', 'combined', 'Cryopreservation medium for MSCs with 10% DMSO', true, 'SOP-MED-003', 30, 'Store at 4°C, prepare fresh when possible'),

-- Combined media for Fibroblasts
('FIBRO-GROWTH', 'Fibroblast Growth Medium', 'combined', 'Complete growth medium for human fibroblasts', true, 'SOP-MED-002', 14, 'Store at 4°C, protect from light, use within 2 weeks'),
('FIBRO-FREEZE', 'Fibroblast Freezing Medium', 'combined', 'Cryopreservation medium for fibroblasts with 10% DMSO', true, 'SOP-MED-003', 30, 'Store at 4°C, prepare fresh when possible')
ON CONFLICT (recipe_code) DO NOTHING;

-- ==================== MEDIA RECIPE COMPONENTS ====================
INSERT INTO media_recipe_components (
  media_recipe_id, component_name, component_type, quantity_percent,
  quantity_per_liter, unit, is_optional, notes
) VALUES
-- MSC Growth Medium components
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-GROWTH'), 'Alpha-MEM', 'base_medium', 89.0, 890, 'ml', false, 'Base medium'),
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-GROWTH'), 'FBS', 'serum', 10.0, 100, 'ml', false, 'Fetal Bovine Serum'),
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-GROWTH'), 'Penicillin-Streptomycin', 'antibiotic', 1.0, 10, 'ml', false, '10,000 U/ml Pen, 10 mg/ml Strep'),
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-GROWTH'), 'L-Glutamine', 'supplement', NULL, 2, 'mM', false, 'Final concentration 2mM'),

-- MSC Freezing Medium components
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-FREEZE'), 'FBS', 'serum', 90.0, 900, 'ml', false, 'Fetal Bovine Serum'),
((SELECT id FROM media_recipes WHERE recipe_code = 'MSC-FREEZE'), 'DMSO', 'supplement', 10.0, 100, 'ml', false, 'Dimethyl sulfoxide - cryoprotectant'),

-- Fibroblast Growth Medium components
((SELECT id FROM media_recipes WHERE recipe_code = 'FIBRO-GROWTH'), 'DMEM', 'base_medium', 89.0, 890, 'ml', false, 'Base medium with 4.5 g/L glucose'),
((SELECT id FROM media_recipes WHERE recipe_code = 'FIBRO-GROWTH'), 'FBS', 'serum', 10.0, 100, 'ml', false, 'Fetal Bovine Serum'),
((SELECT id FROM media_recipes WHERE recipe_code = 'FIBRO-GROWTH'), 'Penicillin-Streptomycin', 'antibiotic', 1.0, 10, 'ml', false, '10,000 U/ml Pen, 10 mg/ml Strep'),

-- Fibroblast Freezing Medium components
((SELECT id FROM media_recipes WHERE recipe_code = 'FIBRO-FREEZE'), 'FBS', 'serum', 90.0, 900, 'ml', false, 'Fetal Bovine Serum'),
((SELECT id FROM media_recipes WHERE recipe_code = 'FIBRO-FREEZE'), 'DMSO', 'supplement', 10.0, 100, 'ml', false, 'Dimethyl sulfoxide - cryoprotectant')
ON CONFLICT DO NOTHING;

-- ==================== INVENTORY ITEMS ====================
INSERT INTO inventory_items (
  item_code, item_name, item_category, item_type, supplier, catalog_number,
  unit, storage_temperature_min, storage_temperature_max, shelf_life_days, is_active
) VALUES
-- Base media
('INV-DMEM-001', 'DMEM High Glucose', 'media', 'Base Medium', 'Gibco', '11965092', 'bottle_500ml', 2, 8, 180, true),
('INV-ALPHA-001', 'Alpha-MEM', 'media', 'Base Medium', 'Gibco', '12571063', 'bottle_500ml', 2, 8, 180, true),
('INV-RPMI-001', 'RPMI 1640', 'media', 'Base Medium', 'Gibco', '21875034', 'bottle_500ml', 2, 8, 180, true),

-- Serum
('INV-FBS-001', 'Fetal Bovine Serum (FBS)', 'serum', 'Serum', 'Gibco', '10270106', 'bottle_500ml', -25, -15, 730, true),
('INV-HS-001', 'Human Serum AB', 'serum', 'Serum', 'Sigma', 'H4522', 'bottle_100ml', -25, -15, 730, true),

-- Antibiotics
('INV-PENSTREP-001', 'Penicillin-Streptomycin 100x', 'reagent', 'Antibiotic', 'Gibco', '15140122', 'bottle_100ml', -25, -15, 365, true),
('INV-GENT-001', 'Gentamicin 50mg/ml', 'reagent', 'Antibiotic', 'Gibco', '15750060', 'bottle_10ml', -25, -15, 365, true),

-- Growth factors
('INV-BFGF-001', 'bFGF Recombinant Human', 'reagent', 'Growth Factor', 'PeproTech', '100-18B', 'vial_100ug', -25, -15, 365, true),
('INV-EGF-001', 'EGF Recombinant Human', 'reagent', 'Growth Factor', 'PeproTech', 'AF-100-15', 'vial_100ug', -25, -15, 365, true),

-- Supplements
('INV-LGLUT-001', 'L-Glutamine 200mM', 'reagent', 'Supplement', 'Gibco', '25030081', 'bottle_100ml', -25, -15, 365, true),
('INV-DMSO-001', 'DMSO Cell Culture Grade', 'reagent', 'Cryoprotectant', 'Sigma', 'D2650', 'bottle_100ml', 15, 25, 1825, true),

-- Enzymes
('INV-TRYP-001', 'Trypsin-EDTA 0.25%', 'reagent', 'Enzyme', 'Gibco', '25200056', 'bottle_100ml', -25, -15, 365, true),
('INV-COLL-001', 'Collagenase Type I', 'reagent', 'Enzyme', 'Worthington', 'LS004196', 'vial_1g', -25, -15, 730, true),

-- Consumables
('INV-PBS-001', 'PBS pH 7.4', 'consumable', 'Buffer', 'Gibco', '10010023', 'bottle_500ml', 2, 8, 365, true),
('INV-HBSS-001', 'HBSS without Ca/Mg', 'consumable', 'Buffer', 'Gibco', '14170112', 'bottle_500ml', 2, 8, 365, true)
ON CONFLICT (item_code) DO NOTHING;

-- ==================== SOPS ====================
INSERT INTO sops (
  sop_code, title, description, version, document_url,
  is_active, effective_date, review_date
) VALUES
('SOP-CULT-001', 'Cell Culture Passage Procedure', 'Standard procedure for passaging adherent cell cultures', '2.1', 'https://docs.example.com/sop-cult-001', true, '2024-01-01', '2024-07-01'),
('SOP-CULT-002', 'Cell Counting and Viability Assessment', 'Procedure for manual cell counting using hemocytometer and trypan blue', '1.5', 'https://docs.example.com/sop-cult-002', true, '2024-01-01', '2024-07-01'),
('SOP-CULT-003', 'Cell Thawing Procedure', 'Standard procedure for thawing cryopreserved cells', '2.0', 'https://docs.example.com/sop-cult-003', true, '2024-01-01', '2024-07-01'),
('SOP-CULT-004', 'Cell Freezing and Cryopreservation', 'Procedure for preparing and freezing cell cultures', '2.2', 'https://docs.example.com/sop-cult-004', true, '2024-01-01', '2024-07-01'),
('SOP-MED-001', 'Base Media Preparation', 'Procedure for preparing base cell culture media', '1.8', 'https://docs.example.com/sop-med-001', true, '2024-01-01', '2024-07-01'),
('SOP-MED-002', 'Complete Media Preparation', 'Procedure for preparing complete growth media with supplements', '1.9', 'https://docs.example.com/sop-med-002', true, '2024-01-01', '2024-07-01'),
('SOP-MED-003', 'Freezing Media Preparation', 'Procedure for preparing cryopreservation media', '2.0', 'https://docs.example.com/sop-med-003', true, '2024-01-01', '2024-07-01'),
('SOP-QC-001', 'Sterility Testing', 'Procedure for testing media and cell cultures for microbial contamination', '1.6', 'https://docs.example.com/sop-qc-001', true, '2024-01-01', '2024-07-01'),
('SOP-QC-002', 'Mycoplasma Testing', 'Procedure for mycoplasma detection using PCR', '1.4', 'https://docs.example.com/sop-qc-002', true, '2024-01-01', '2024-07-01'),
('SOP-DONOR-001', 'Donor Material Reception and Processing', 'Procedure for receiving and initial processing of donor tissue', '2.3', 'https://docs.example.com/sop-donor-001', true, '2024-01-01', '2024-07-01')
ON CONFLICT (sop_code) DO NOTHING;

-- ==================== SUMMARY ====================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DICTIONARY DATA SEEDING COMPLETED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Container Types: % records', (SELECT COUNT(*) FROM container_types);
  RAISE NOTICE 'Vial Types: % records', (SELECT COUNT(*) FROM vial_types);
  RAISE NOTICE 'Locations: % records', (SELECT COUNT(*) FROM locations);
  RAISE NOTICE 'Equipment: % records', (SELECT COUNT(*) FROM equipment);
  RAISE NOTICE 'Storage Zones: % records', (SELECT COUNT(*) FROM storage_zones);
  RAISE NOTICE 'Media Recipes: % records', (SELECT COUNT(*) FROM media_recipes);
  RAISE NOTICE 'Media Recipe Components: % records', (SELECT COUNT(*) FROM media_recipe_components);
  RAISE NOTICE 'Inventory Items: % records', (SELECT COUNT(*) FROM inventory_items);
  RAISE NOTICE 'SOPs: % records', (SELECT COUNT(*) FROM sops);
  RAISE NOTICE '==============================================';
END $$;
