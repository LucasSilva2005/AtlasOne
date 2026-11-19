
-- V2: Cadastro de clientes e pedidos

-- Clientes de cada empresa
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    document VARCHAR(20),
    phone VARCHAR(30),
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id),

    CONSTRAINT uq_customers_organization_id
        UNIQUE (organization_id, id),

    CONSTRAINT chk_customers_status
        CHECK (status IN ('active', 'inactive'))
);

-- Evita duplicidade de CPF/CNPJ dentro da mesma empresa
CREATE UNIQUE INDEX uq_customers_document
    ON customers(organization_id, document)
    WHERE document IS NOT NULL AND document <> '';

CREATE INDEX idx_customers_organization
    ON customers(organization_id);

CREATE INDEX idx_customers_name
    ON customers(organization_id, name);


-- Identificadores dos clientes nos sistemas externos
CREATE TABLE customer_external_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    external_customer_id VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_external_ids_customer
        FOREIGN KEY (organization_id, customer_id)
        REFERENCES customers(organization_id, id),

    CONSTRAINT uq_customer_external_ids_provider
        UNIQUE (organization_id, provider, external_customer_id)
);

CREATE INDEX idx_customer_external_ids_customer
    ON customer_external_ids(organization_id, customer_id);


-- Pedidos recebidos pelo AtlasOne
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,

    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    external_order_id VARCHAR(150),
    order_number VARCHAR(100),

    status VARCHAR(40) NOT NULL DEFAULT 'pending',

    currency CHAR(3) NOT NULL DEFAULT 'BRL',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    placed_at TIMESTAMPTZ,

    -- Fotografia do endereço no momento do pedido
    recipient_name VARCHAR(150),
    postal_code VARCHAR(15),
    street VARCHAR(200),
    address_number VARCHAR(30),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    country_code CHAR(2) NOT NULL DEFAULT 'BR',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_customer
        FOREIGN KEY (organization_id, customer_id)
        REFERENCES customers(organization_id, id),

    CONSTRAINT uq_orders_organization_id
        UNIQUE (organization_id, id),

    CONSTRAINT chk_orders_amounts
        CHECK (
            subtotal >= 0
            AND shipping_cost >= 0
            AND discount >= 0
            AND total >= 0
        )
);

-- Evita importar o mesmo pedido duas vezes
CREATE UNIQUE INDEX uq_orders_external_id
    ON orders(organization_id, source, external_order_id)
    WHERE external_order_id IS NOT NULL;

CREATE INDEX idx_orders_customer
    ON orders(organization_id, customer_id);

CREATE INDEX idx_orders_status
    ON orders(organization_id, status);

CREATE INDEX idx_orders_placed_at
    ON orders(organization_id, placed_at);
