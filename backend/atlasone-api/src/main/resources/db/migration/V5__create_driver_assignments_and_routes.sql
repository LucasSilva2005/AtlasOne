
-- V5: Operação de motoristas e gerenciamento de rotas

-- =====================================================
-- 1. GARANTIR RELACIONAMENTO ENTRE USUÁRIOS E EMPRESAS
-- =====================================================

ALTER TABLE app_users
ADD CONSTRAINT uq_app_users_organization_id
UNIQUE (organization_id, id);


-- =====================================================
-- 2. HISTÓRICO DE ACEITE E LIBERAÇÃO DE ENTREGAS
-- =====================================================

CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    delivery_id UUID NOT NULL,
    driver_user_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'accepted',

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ,
    released_by_user_id UUID,
    release_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_delivery_assignments_delivery
        FOREIGN KEY (organization_id, delivery_id)
        REFERENCES deliveries (organization_id, id),

    CONSTRAINT fk_delivery_assignments_driver
        FOREIGN KEY (organization_id, driver_user_id)
        REFERENCES app_users (organization_id, id),

    CONSTRAINT fk_delivery_assignments_released_by
        FOREIGN KEY (organization_id, released_by_user_id)
        REFERENCES app_users (organization_id, id),

    CONSTRAINT chk_delivery_assignments_status
        CHECK (status IN ('accepted', 'released', 'revoked', 'completed')),

    CONSTRAINT uq_delivery_assignments_reference
        UNIQUE (organization_id, id, delivery_id, driver_user_id)
);

-- Uma entrega só pode ter um aceite ativo por vez.
CREATE UNIQUE INDEX uq_delivery_assignments_active_delivery
    ON delivery_assignments (organization_id, delivery_id)
    WHERE status = 'accepted';

CREATE INDEX idx_delivery_assignments_driver
    ON delivery_assignments (organization_id, driver_user_id, status);

CREATE INDEX idx_delivery_assignments_delivery
    ON delivery_assignments (organization_id, delivery_id);


-- =====================================================
-- 3. ROTAS DOS MOTORISTAS
-- =====================================================

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    driver_user_id UUID NOT NULL,

    route_code VARCHAR(40) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'planned',

    optimization_data JSONB,
    optimized_at TIMESTAMPTZ,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_routes_driver
        FOREIGN KEY (organization_id, driver_user_id)
        REFERENCES app_users (organization_id, id),

    CONSTRAINT chk_routes_status
        CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

    CONSTRAINT uq_routes_organization_id
        UNIQUE (organization_id, id),

    CONSTRAINT uq_routes_organization_id_driver
        UNIQUE (organization_id, id, driver_user_id),

    CONSTRAINT uq_routes_code
        UNIQUE (organization_id, route_code)
);

CREATE INDEX idx_routes_driver_status
    ON routes (organization_id, driver_user_id, status);

CREATE INDEX idx_routes_created_at
    ON routes (organization_id, created_at);


-- =====================================================
-- 4. PARADAS DAS ROTAS
-- =====================================================

CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    route_id UUID NOT NULL,
    delivery_id UUID NOT NULL,
    assignment_id UUID NOT NULL,
    driver_user_id UUID NOT NULL,

    sequence_number INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    planned_arrival_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    failure_reason TEXT,

    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_route_stops_route
        FOREIGN KEY (organization_id, route_id, driver_user_id)
        REFERENCES routes (organization_id, id, driver_user_id),

    CONSTRAINT fk_route_stops_assignment
        FOREIGN KEY (
            organization_id,
            assignment_id,
            delivery_id,
            driver_user_id
        )
        REFERENCES delivery_assignments (
            organization_id,
            id,
            delivery_id,
            driver_user_id
        ),

    CONSTRAINT fk_route_stops_delivery
        FOREIGN KEY (organization_id, delivery_id)
        REFERENCES deliveries (organization_id, id),

    CONSTRAINT chk_route_stops_sequence
        CHECK (sequence_number > 0),

    CONSTRAINT chk_route_stops_status
        CHECK (status IN (
            'pending',
            'arrived',
            'delivered',
            'failed',
            'skipped',
            'removed'
        )),

    CONSTRAINT uq_route_stops_sequence
        UNIQUE (organization_id, route_id, sequence_number)
);

-- Uma entrega não pode estar em duas rotas simultaneamente.
-- Ao remover uma parada, removed_at recebe a data da remoção.
CREATE UNIQUE INDEX uq_route_stops_active_delivery
    ON route_stops (organization_id, delivery_id)
    WHERE removed_at IS NULL;

CREATE INDEX idx_route_stops_route_sequence
    ON route_stops (organization_id, route_id, sequence_number);

CREATE INDEX idx_route_stops_delivery
    ON route_stops (organization_id, delivery_id);
