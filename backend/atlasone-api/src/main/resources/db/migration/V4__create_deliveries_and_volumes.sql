
-- V4: Estrutura de entregas, itens e volumes


-- =============================================
-- 1. COMPLEMENTO DO SNAPSHOT DO PEDIDO
-- =============================================

ALTER TABLE orders
    ADD COLUMN recipient_phone VARCHAR(30),
    ADD COLUMN recipient_email VARCHAR(255);


-- =============================================
-- 2. PREPARACAO DAS CHAVES DOS ITENS
-- =============================================

ALTER TABLE order_items
    ADD CONSTRAINT uq_order_items_organization_order_id
    UNIQUE (organization_id, order_id, id);


-- =============================================
-- 3. ENTREGAS
-- =============================================

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    order_id UUID NOT NULL,

    delivery_code VARCHAR(40) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'available',

    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30),
    recipient_email VARCHAR(255),

    postal_code VARCHAR(15),
    street VARCHAR(200),
    address_number VARCHAR(30),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    country_code CHAR(2) NOT NULL DEFAULT 'BR',

    delivery_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_deliveries_order
        FOREIGN KEY (organization_id, order_id)
        REFERENCES orders(organization_id, id),

    CONSTRAINT uq_deliveries_organization_id
        UNIQUE (organization_id, id),

    CONSTRAINT uq_deliveries_organization_order_id
        UNIQUE (organization_id, id, order_id),

    CONSTRAINT uq_deliveries_code
        UNIQUE (organization_id, delivery_code),

    CONSTRAINT chk_deliveries_status
        CHECK (
            status IN (
                'available',
                'accepted',
                'in_route',
                'delivered',
                'failed',
                'cancelled'
            )
        )
);

CREATE INDEX idx_deliveries_organization_status
    ON deliveries(organization_id, status);

CREATE INDEX idx_deliveries_order
    ON deliveries(organization_id, order_id);

CREATE INDEX idx_deliveries_created_at
    ON deliveries(organization_id, created_at);


-- =============================================
-- 4. ITENS DE CADA ENTREGA
-- =============================================

CREATE TABLE delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    delivery_id UUID NOT NULL,
    order_id UUID NOT NULL,
    order_item_id UUID NOT NULL,

    quantity NUMERIC(12,3) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_delivery_items_delivery
        FOREIGN KEY (organization_id, delivery_id, order_id)
        REFERENCES deliveries(organization_id, id, order_id),

    CONSTRAINT fk_delivery_items_order_item
        FOREIGN KEY (organization_id, order_id, order_item_id)
        REFERENCES order_items(organization_id, order_id, id),

    CONSTRAINT uq_delivery_items_item
        UNIQUE (organization_id, delivery_id, order_item_id),

    CONSTRAINT chk_delivery_items_quantity
        CHECK (quantity > 0)
);

CREATE INDEX idx_delivery_items_delivery
    ON delivery_items(organization_id, delivery_id);

CREATE INDEX idx_delivery_items_order_item
    ON delivery_items(organization_id, order_item_id);


-- =============================================
-- 5. CONTROLE DE QUANTIDADE DISTRIBUIDA
-- =============================================

CREATE OR REPLACE FUNCTION check_delivery_item_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ordered_quantity NUMERIC(12,3);
    v_allocated_quantity NUMERIC(12,3);
BEGIN
    -- Bloqueia o item do pedido durante a verificacao.
    -- Isso evita excesso de distribuicao em operacoes simultaneas.
    SELECT quantity
    INTO v_ordered_quantity
    FROM order_items
    WHERE id = NEW.order_item_id
      AND organization_id = NEW.organization_id
      AND order_id = NEW.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Item do pedido nao encontrado.';
    END IF;

    -- Soma as quantidades ja distribuidas.
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_allocated_quantity
    FROM delivery_items
    WHERE organization_id = NEW.organization_id
      AND order_item_id = NEW.order_item_id
      AND id <> NEW.id;

    -- Impede distribuir mais do que foi comprado.
    IF v_allocated_quantity + NEW.quantity > v_ordered_quantity THEN
        RAISE EXCEPTION
            'Quantidade excede o total comprado. Disponivel: %, solicitado: %.',
            v_ordered_quantity - v_allocated_quantity,
            NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_delivery_item_quantity
BEFORE INSERT OR UPDATE ON delivery_items
FOR EACH ROW
EXECUTE FUNCTION check_delivery_item_quantity();


-- =============================================
-- 6. VOLUMES FISICOS OPCIONAIS
-- =============================================

CREATE TABLE delivery_volumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    delivery_id UUID NOT NULL,

    volume_number INTEGER NOT NULL,
    volume_code VARCHAR(40) NOT NULL,

    description VARCHAR(200),

    weight_kg NUMERIC(10,3),
    length_cm NUMERIC(10,2),
    width_cm NUMERIC(10,2),
    height_cm NUMERIC(10,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_delivery_volumes_delivery
        FOREIGN KEY (organization_id, delivery_id)
        REFERENCES deliveries(organization_id, id),

    CONSTRAINT uq_delivery_volumes_number
        UNIQUE (organization_id, delivery_id, volume_number),

    CONSTRAINT uq_delivery_volumes_code
        UNIQUE (organization_id, volume_code),

    CONSTRAINT chk_delivery_volumes_number
        CHECK (volume_number > 0),

    CONSTRAINT chk_delivery_volumes_dimensions
        CHECK (
            (weight_kg IS NULL OR weight_kg >= 0)
            AND (length_cm IS NULL OR length_cm >= 0)
            AND (width_cm IS NULL OR width_cm >= 0)
            AND (height_cm IS NULL OR height_cm >= 0)
        )
);

CREATE INDEX idx_delivery_volumes_delivery
    ON delivery_volumes(organization_id, delivery_id);
