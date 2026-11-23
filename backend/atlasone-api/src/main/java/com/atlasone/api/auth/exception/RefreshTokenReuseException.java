package com.atlasone.api.auth.exception;

public class RefreshTokenReuseException extends RuntimeException {

    public RefreshTokenReuseException() {
        super("Refresh token reutilizado. Sessão revogada.");
    }
}
