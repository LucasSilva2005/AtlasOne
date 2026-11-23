
package com.atlasone.api.common.security;

import com.atlasone.api.user.entity.AppUser;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public JwtService(
            JwtEncoder jwtEncoder,
            JwtProperties jwtProperties
    ) {
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(AppUser user) {

        Instant now = Instant.now();

        Instant expiration = now.plusMillis(
                jwtProperties.getAccessTokenExpiration()
        );

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("atlasone-api")
                .issuedAt(now)
                .expiresAt(expiration)
                .subject(user.getId().toString())
                .claim("organization_id", user.getOrganizationId().toString())
                .claim("role", user.getRole())
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }
}
