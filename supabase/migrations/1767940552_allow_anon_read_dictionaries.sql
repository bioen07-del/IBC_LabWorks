-- Migration: allow_anon_read_dictionaries
-- Created at: 1767940552


-- Разрешаем anon читать справочные таблицы
CREATE POLICY "Allow anon read container_types" ON container_types FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read locations" ON locations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read equipment" ON equipment FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read storage_zones" ON storage_zones FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read media_recipes" ON media_recipes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read combined_media_batches" ON combined_media_batches FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read process_templates" ON process_templates FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read sops" ON sops FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read donors" ON donors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read donations" ON donations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read cultures" ON cultures FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read inventory_items" ON inventory_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read users" ON users FOR SELECT TO anon USING (true);

-- Также разрешаем anon делать INSERT/UPDATE для демо режима
CREATE POLICY "Allow anon insert donations" ON donations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update donations" ON donations FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon insert cultures" ON cultures FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update cultures" ON cultures FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon insert donors" ON donors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update donors" ON donors FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon update users" ON users FOR UPDATE TO anon USING (true);
;