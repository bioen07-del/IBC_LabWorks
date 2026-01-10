-- Migration: add_rls_policies_for_references
-- Created at: 1767888434

-- Enable RLS and add policies for reference tables
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Allow read equipment for authenticated" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all equipment for authenticated" ON equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Locations policies
CREATE POLICY "Allow read locations for authenticated" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all locations for authenticated" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Container types policies
CREATE POLICY "Allow read container_types for authenticated" ON container_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all container_types for authenticated" ON container_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SOPs policies
CREATE POLICY "Allow read sops for authenticated" ON sops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all sops for authenticated" ON sops FOR ALL TO authenticated USING (true) WITH CHECK (true);;