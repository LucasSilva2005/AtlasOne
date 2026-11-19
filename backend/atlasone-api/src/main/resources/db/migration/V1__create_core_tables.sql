
-- V1: Estrutura inicial do AtlasOne

-- Empresas cadastradas na plataforma
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_organizations_status
        CHECK (status IN ('active', 'suspended', 'cancelled'))
);

-- Usuários internos de cada empresa
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'operator',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_app_users_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id),

    CONSTRAINT chk_app_users_role
        CHECK (role IN ('admin', 'operator', 'driver')),

    CONSTRAINT chk_app_users_status
        CHECK (status IN ('active', 'inactive')),

    CONSTRAINT uq_app_users_email
        UNIQUE (organization_id, email)
);

CREATE INDEX idx_app_users_organization
    ON app_users(organization_id);
