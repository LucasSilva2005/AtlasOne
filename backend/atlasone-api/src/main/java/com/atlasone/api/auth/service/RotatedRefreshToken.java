
package com.atlasone.api.auth.service;

import java.util.UUID;

public record RotatedRefreshToken(
        UUID organizationId,
        UUID userId,
        String rawToken
) {
}
