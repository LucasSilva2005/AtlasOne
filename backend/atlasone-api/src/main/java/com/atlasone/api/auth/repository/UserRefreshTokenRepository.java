package com.atlasone.api.auth.repository;

import com.atlasone.api.auth.entity.UserRefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRefreshTokenRepository
        extends JpaRepository<UserRefreshToken, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT token
        FROM UserRefreshToken token
        WHERE token.tokenHash = :tokenHash
    """)
    Optional<UserRefreshToken> findWithLockByTokenHash(
            @Param("tokenHash") String tokenHash
    );

    @Modifying
    @Query("""
        UPDATE UserRefreshToken token
        SET token.revokedAt = CURRENT_TIMESTAMP
        WHERE token.familyId = :familyId
        AND token.revokedAt IS NULL
    """)
    int revokeActiveTokensByFamilyId(
            @Param("familyId") UUID familyId
    );

    @Modifying
    @Query("""
        UPDATE UserRefreshToken token
        SET token.revokedAt = CURRENT_TIMESTAMP
        WHERE token.organizationId = :organizationId
        AND token.userId = :userId
        AND token.revokedAt IS NULL
    """)
    int revokeActiveTokensByUser(
            @Param("organizationId") UUID organizationId,
            @Param("userId") UUID userId
    );
}