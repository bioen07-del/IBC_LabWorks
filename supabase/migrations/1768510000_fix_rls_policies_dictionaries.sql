-- Migration: Fix RLS Policies for Dictionaries
-- Created at: 2026-01-16
-- Purpose: Allow authenticated users to INSERT/UPDATE/DELETE in reference tables

-- Container Types policies
DROP POLICY IF EXISTS "Allow insert container_types for authenticated users" ON container_types;
DROP POLICY IF EXISTS "Allow update container_types for authenticated users" ON container_types;
DROP POLICY IF EXISTS "Allow delete container_types for authenticated users" ON container_types;

CREATE POLICY "Allow insert container_types for authenticated users"
ON container_types FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update container_types for authenticated users"
ON container_types FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete container_types for authenticated users"
ON container_types FOR DELETE
TO authenticated
USING (true);

-- Process Templates policies
DROP POLICY IF EXISTS "Allow insert process_templates for authenticated users" ON process_templates;
DROP POLICY IF EXISTS "Allow update process_templates for authenticated users" ON process_templates;
DROP POLICY IF EXISTS "Allow delete process_templates for authenticated users" ON process_templates;

CREATE POLICY "Allow insert process_templates for authenticated users"
ON process_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update process_templates for authenticated users"
ON process_templates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete process_templates for authenticated users"
ON process_templates FOR DELETE
TO authenticated
USING (true);

-- Process Template Steps policies
DROP POLICY IF EXISTS "Allow insert process_template_steps for authenticated users" ON process_template_steps;
DROP POLICY IF EXISTS "Allow update process_template_steps for authenticated users" ON process_template_steps;
DROP POLICY IF EXISTS "Allow delete process_template_steps for authenticated users" ON process_template_steps;

CREATE POLICY "Allow insert process_template_steps for authenticated users"
ON process_template_steps FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update process_template_steps for authenticated users"
ON process_template_steps FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete process_template_steps for authenticated users"
ON process_template_steps FOR DELETE
TO authenticated
USING (true);

-- Locations policies (also a dictionary table)
DROP POLICY IF EXISTS "Allow insert locations for authenticated users" ON locations;
DROP POLICY IF EXISTS "Allow update locations for authenticated users" ON locations;
DROP POLICY IF EXISTS "Allow delete locations for authenticated users" ON locations;

CREATE POLICY "Allow insert locations for authenticated users"
ON locations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update locations for authenticated users"
ON locations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete locations for authenticated users"
ON locations FOR DELETE
TO authenticated
USING (true);

-- Equipment policies
DROP POLICY IF EXISTS "Allow insert equipment for authenticated users" ON equipment;
DROP POLICY IF EXISTS "Allow update equipment for authenticated users" ON equipment;
DROP POLICY IF EXISTS "Allow delete equipment for authenticated users" ON equipment;

CREATE POLICY "Allow insert equipment for authenticated users"
ON equipment FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update equipment for authenticated users"
ON equipment FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete equipment for authenticated users"
ON equipment FOR DELETE
TO authenticated
USING (true);

-- Media Recipes policies
DROP POLICY IF EXISTS "Allow insert media_recipes for authenticated users" ON media_recipes;
DROP POLICY IF EXISTS "Allow update media_recipes for authenticated users" ON media_recipes;
DROP POLICY IF EXISTS "Allow delete media_recipes for authenticated users" ON media_recipes;

CREATE POLICY "Allow insert media_recipes for authenticated users"
ON media_recipes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update media_recipes for authenticated users"
ON media_recipes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete media_recipes for authenticated users"
ON media_recipes FOR DELETE
TO authenticated
USING (true);
