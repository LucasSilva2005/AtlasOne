
package com.atlasone.api.common.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class JwtAuthenticationConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        String role = jwt.getClaimAsString("role");

        if (role == null || !List.of(
                "admin",
                "operator",
                "driver"
        ).contains(role)) {
            throw new IllegalArgumentException(
                    "Perfil de usuário inválido no token JWT."
            );
        }

        String authority = "ROLE_" + role.toUpperCase(Locale.ROOT);

        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority(authority)),
                jwt.getSubject()
        );
    }
}
