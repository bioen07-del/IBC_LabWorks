-- Migration: allow_anon_releases_orders
-- Created at: 1767941011


-- Разрешаем anon операции с releases и orders
CREATE POLICY "Allow anon read releases" ON releases FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert releases" ON releases FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update releases" ON releases FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon read orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update orders" ON orders FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon read containers" ON containers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert containers" ON containers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update containers" ON containers FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon read audit_logs" ON audit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert audit_logs" ON audit_logs FOR INSERT TO anon WITH CHECK (true);
;