
-- V3: Itens dos pedidos e historico de eventos


-- =============================================
-- 1. ITENS DOS PEDIDOS
-- =============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    order_id UUID NOT NULL,

    external_item_id VARCHAR(150),
    external_product_id VARCHAR(150),

    sku VARCHAR(100),
    product_name VARCHAR(200) NOT NULL,
    description TEXT,

    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20),

    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    position INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (organization_id, order_id)
        REFERENCES orders(organization_id, id),

    CONSTRAINT chk_order_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_items_amounts
        CHECK (
            unit_price >= 0
            AND discount >= 0
            AND total >= 0
        ),

    CONSTRAINT chk_order_items_position
        CHECK (position > 0)
);

CREATE INDEX idx_order_items_order
    ON order_items(organization_id, order_id);

CREATE INDEX idx_order_items_sku
    ON order_items(organization_id, sku);

CREATE UNIQUE INDEX uq_order_items_external_id
    ON order_items(organization_id, order_id, external_item_id)
    WHERE external_item_id IS NOT NULL;


-- =============================================
-- 2. HISTORICO DE EVENTOS DOS PEDIDOS
-- =============================================

CREATE TABLE order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    order_id UUID NOT NULL,

    event_type VARCHAR(60) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,

    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    external_event_id VARCHAR(150),

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_events_order
        FOREIGN KEY (organization_id, order_id)
        REFERENCES orders(organization_id, id)
);

CREATE INDEX idx_order_events_order
    ON order_events(organization_id, order_id, occurred_at);

CREATE INDEX idx_order_events_type
    ON order_events(organization_id, event_type);

CREATE UNIQUE INDEX uq_order_events_external_id
    ON order_events(organization_id, source, external_event_id)
    WHERE external_event_id IS NOT NULL;
