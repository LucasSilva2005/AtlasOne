
package com.atlasone.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(

        @NotBlank(message = "Refresh token é obrigatório.")
        String refreshToken

) {
}
