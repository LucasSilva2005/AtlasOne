
package com.atlasone.api.auth.service;

import com.atlasone.api.auth.dto.LoginRequest;
import com.atlasone.api.auth.dto.LoginResponse;
import com.atlasone.api.common.security.JwtService;
import com.atlasone.api.organization.entity.Organization;
import com.atlasone.api.organization.repository.OrganizationRepository;
import com.atlasone.api.user.entity.AppUser;
import com.atlasone.api.user.repository.AppUserRepository;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthService {

    private static final String ACTIVE_STATUS = "active";

    private final OrganizationRepository organizationRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            OrganizationRepository organizationRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService
    ) {
        this.organizationRepository = organizationRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public LoginResponse login(LoginRequest request) {

        String organizationSlug = request.organizationSlug()
                .trim()
                .toLowerCase(Locale.ROOT);

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        Organization organization = organizationRepository
                .findBySlugAndStatus(
                        organizationSlug,
                        ACTIVE_STATUS
                )
                .orElseThrow(() -> new BadCredentialsException(
                        "Credenciais inválidas."
                ));

        AppUser user = appUserRepository
                .findByOrganizationIdAndEmailAndStatus(
                        organization.getId(),
                        email,
                        ACTIVE_STATUS
                )
                .orElseThrow(() -> new BadCredentialsException(
                        "Credenciais inválidas."
                ));

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new BadCredentialsException(
                    "Credenciais inválidas."
            );
        }

        String accessToken = jwtService.generateAccessToken(user);

        String refreshToken = refreshTokenService.createRefreshToken(user);

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                900
        );
    }

public LoginResponse refresh(String rawRefreshToken) {

    RotatedRefreshToken rotatedToken =
            refreshTokenService.rotateRefreshToken(rawRefreshToken);

    AppUser user = appUserRepository
            .findByOrganizationIdAndIdAndStatus(
                    rotatedToken.organizationId(),
                    rotatedToken.userId(),
                    ACTIVE_STATUS
            )
            .orElseThrow(() -> new BadCredentialsException(
                    "Credenciais inválidas."
            ));

    Organization organization = organizationRepository
            .findById(rotatedToken.organizationId())
            .filter(org -> ACTIVE_STATUS.equals(org.getStatus()))
            .orElseThrow(() -> new BadCredentialsException(
                    "Credenciais inválidas."
            ));

    String accessToken = jwtService.generateAccessToken(user);

    return new LoginResponse(
            accessToken,
            rotatedToken.rawToken(),
            "Bearer",
            900
    );
}

}
