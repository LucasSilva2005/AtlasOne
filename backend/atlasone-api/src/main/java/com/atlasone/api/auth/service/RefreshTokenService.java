package com.atlasone.api.auth.service;

import com.atlasone.api.auth.entity.UserRefreshToken;
import com.atlasone.api.auth.exception.RefreshTokenReuseException;
import com.atlasone.api.auth.repository.UserRefreshTokenRepository;
import com.atlasone.api.user.entity.AppUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;
    private static final int EXPIRATION_DAYS = 30;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(
            UserRefreshTokenRepository refreshTokenRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public String createRefreshToken(AppUser user) {

        UUID familyId = UUID.randomUUID();

        return createAndSaveToken(
                user.getOrganizationId(),
                user.getId(),
                familyId
        );
    }

    @Transactional(noRollbackFor = RefreshTokenReuseException.class)
    public RotatedRefreshToken rotateRefreshToken(String rawToken) {

        String tokenHash = hashToken(rawToken);

        UserRefreshToken currentToken = refreshTokenRepository
                .findWithLockByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Refresh token inválido."
                ));

        if (currentToken.getRevokedAt() != null) {

            refreshTokenRepository.revokeActiveTokensByFamilyId(
                    currentToken.getFamilyId()
            );

            throw new RefreshTokenReuseException();
        }

        if (!currentToken.getExpiresAt().isAfter(
                OffsetDateTime.now(ZoneOffset.UTC)
        )) {

            currentToken.revoke();

            throw new IllegalArgumentException(
                    "Refresh token expirado."
            );
        }

        String newRawToken = createAndSaveToken(
                currentToken.getOrganizationId(),
                currentToken.getUserId(),
                currentToken.getFamilyId()
        );

        UserRefreshToken newToken = refreshTokenRepository
                .findWithLockByTokenHash(hashToken(newRawToken))
                .orElseThrow(() -> new IllegalStateException(
                        "Falha ao localizar o novo refresh token."
                ));

        currentToken.revoke();

        currentToken.setReplacedByTokenId(
                newToken.getId()
        );

        return new RotatedRefreshToken(
        currentToken.getOrganizationId(),
        currentToken.getUserId(),
        newRawToken
);
    }

    private String createAndSaveToken(
            UUID organizationId,
            UUID userId,
            UUID familyId
    ) {

        byte[] randomBytes = new byte[TOKEN_BYTES];

        SECURE_RANDOM.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);

        OffsetDateTime expiration = OffsetDateTime
                .now(ZoneOffset.UTC)
                .plusDays(EXPIRATION_DAYS);

        UserRefreshToken refreshToken = new UserRefreshToken(
                organizationId,
                userId,
                familyId,
                tokenHash,
                expiration
        );

        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    public String hashToken(String rawToken) {

        try {

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(
                            java.nio.charset.StandardCharsets.UTF_8
                    )
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "Não foi possível calcular o hash do refresh token.",
                    exception
            );
        }
    }
}