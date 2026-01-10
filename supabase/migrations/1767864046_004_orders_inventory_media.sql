-- Migration: 004_orders_inventory_media
-- Created at: 1767864046

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_contact JSONB,
    cell_type_required VARCHAR(100) NOT NULL,
    quantity_required INTEGER NOT NULL,
    delivery_date_target DATE,
    status order_status NOT NULL DEFAULT 'received',
    priority order_priority NOT NULL DEFAULT 'standard',
    special_requirements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_priority ON orders(priority);

-- Inventory items
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_category inventory_category NOT NULL,
    item_type VARCHAR(100),
    supplier VARCHAR(255),
    catalog_number VARCHAR(100),
    lot_number VARCHAR(100),
    batch_code VARCHAR(50),
    quantity DECIMAL(10,2) NOT NULL,
    quantity_remaining DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    receipt_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    storage_location_id INTEGER REFERENCES locations(id),
    storage_conditions VARCHAR(100),
    status inventory_status NOT NULL DEFAULT 'active',
    qc_status qc_status NOT NULL DEFAULT 'pending',
    certificate_of_analysis_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_category ON inventory_items(item_category);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_expiry ON inventory_items(expiry_date);
CREATE INDEX idx_inventory_location ON inventory_items(storage_location_id);

-- Media recipes
CREATE TABLE media_recipes (
    id SERIAL PRIMARY KEY,
    recipe_code VARCHAR(50) UNIQUE NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    recipe_type media_recipe_type NOT NULL DEFAULT 'combined',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    preparation_sop_reference VARCHAR(100),
    shelf_life_days INTEGER NOT NULL DEFAULT 14,
    storage_conditions VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media recipe components
CREATE TABLE media_recipe_components (
    id SERIAL PRIMARY KEY,
    media_recipe_id INTEGER NOT NULL REFERENCES media_recipes(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL,
    component_type component_type NOT NULL,
    quantity_percent DECIMAL(5,2),
    quantity_per_liter DECIMAL(10,4),
    unit VARCHAR(20) NOT NULL,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_components_recipe ON media_recipe_components(media_recipe_id);

-- Media component batches (links to inventory)
CREATE TABLE media_component_batches (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    component_name VARCHAR(100) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    lot_number VARCHAR(100),
    quantity_remaining DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    expiry_date DATE NOT NULL,
    status media_batch_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_component_batches_inventory ON media_component_batches(inventory_item_id);
CREATE INDEX idx_component_batches_expiry ON media_component_batches(expiry_date);

-- Combined media batches (prepared media)
CREATE TABLE combined_media_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    media_recipe_id INTEGER NOT NULL REFERENCES media_recipes(id) ON DELETE RESTRICT,
    preparation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    volume_remaining_ml DECIMAL(10,2) NOT NULL,
    sterility_status sterility_status NOT NULL DEFAULT 'pending',
    status media_batch_status NOT NULL DEFAULT 'active',
    prepared_by_user_id INTEGER REFERENCES users(id),
    storage_location_id INTEGER REFERENCES locations(id),
    qr_code_data JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_combined_media_recipe ON combined_media_batches(media_recipe_id);
CREATE INDEX idx_combined_media_status ON combined_media_batches(status);
CREATE INDEX idx_combined_media_expiry ON combined_media_batches(expiry_date);

-- Combined media batch components (traceability)
CREATE TABLE combined_media_batch_components (
    id SERIAL PRIMARY KEY,
    combined_media_batch_id INTEGER NOT NULL REFERENCES combined_media_batches(id) ON DELETE CASCADE,
    media_component_batch_id INTEGER NOT NULL REFERENCES media_component_batches(id) ON DELETE RESTRICT,
    quantity_used DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_components_batch ON combined_media_batch_components(combined_media_batch_id);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    transaction_type transaction_type NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    executed_step_id INTEGER, -- FK добавим позже
    combined_media_batch_id INTEGER REFERENCES combined_media_batches(id),
    performed_by_user_id INTEGER REFERENCES users(id),
    reason TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_trans_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inv_trans_timestamp ON inventory_transactions(timestamp);;