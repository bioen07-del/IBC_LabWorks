-- Migration: anon_policies_new_tables
-- Created at: 1767953144


-- Enable RLS
ALTER TABLE cca_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_qp_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_media_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE executed_step_container_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "anon_read_cca_rules" ON cca_rules FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_sop_versions" ON sop_versions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_all_notifications" ON notifications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tasks" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_qp_decisions" ON donation_qp_decisions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_media_usage" ON container_media_usage FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_step_results" ON executed_step_container_results FOR ALL TO anon USING (true) WITH CHECK (true);
;