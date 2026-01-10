-- Migration: 008_functions_and_triggers
-- Created at: 1767864174

-- Functions for code generation
CREATE OR REPLACE FUNCTION generate_donor_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'DON-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('donor_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_donation_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'DONAT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('donation_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_culture_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'BMCP-C-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('culture_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('order_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_release_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'REL-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('release_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_deviation_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'DEV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('deviation_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_qc_test_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'QC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('qc_test_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_process_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'EXEC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('process_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_session_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'SES-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('session_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_media_batch_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'MED-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('media_batch_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_inventory_code() RETURNS VARCHAR AS $$
BEGIN
    RETURN 'MAT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('inventory_code_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Container code generation (culture_code-P{passage}-{split})
CREATE OR REPLACE FUNCTION generate_container_code(
    p_culture_code VARCHAR,
    p_container_type_code VARCHAR,
    p_passage INTEGER,
    p_split_index INTEGER
) RETURNS VARCHAR AS $$
BEGIN
    RETURN p_container_type_code || '-' || 
           SPLIT_PART(p_culture_code, '-', 4) || '-' ||
           'P' || p_passage || '-' || p_split_index;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_telegram_users_updated_at BEFORE UPDATE ON telegram_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sops_updated_at BEFORE UPDATE ON sops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_donors_updated_at BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_media_recipes_updated_at BEFORE UPDATE ON media_recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_cultures_updated_at BEFORE UPDATE ON cultures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_containers_updated_at BEFORE UPDATE ON containers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_process_templates_updated_at BEFORE UPDATE ON process_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();;