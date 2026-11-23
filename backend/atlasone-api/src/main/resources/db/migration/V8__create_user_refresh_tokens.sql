
-- V8: Armazenamento seguro de refresh tokens.

CREATE TABLE user_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Identifica a família de tokens de uma sessão.
    family_id UUID NOT NULL,

    -- Hash SHA-256 do refresh token original.
    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,

    -- Referência ao token emitido na próxima rotação.
    replaced_by_token_id UUID,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (organization_id, user_id)
        REFERENCES app_users (organization_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_refresh_tokens_replaced_by
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES user_refresh_tokens (id),

    CONSTRAINT chk_refresh_tokens_expiration
        CHECK (expires_at > created_at)
);

-- Consulta de sessões de um usuário.
CREATE INDEX idx_refresh_tokens_user
    ON user_refresh_tokens(organization_id, user_id);

-- Consulta de todos os tokens pertencentes a uma sessão.
CREATE INDEX idx_refresh_tokens_family
    ON user_refresh_tokens(family_id);

-- Identificação de tokens expirados para limpeza futura.
CREATE INDEX idx_refresh_tokens_expiration
    ON user_refresh_tokens(expires_at);
