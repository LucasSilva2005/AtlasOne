
package com.atlasone.api.user.repository;

import com.atlasone.api.user.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByOrganizationIdAndEmailAndStatus(
            UUID organizationId,
            String email,
            String status
    );

    Optional<AppUser> findByOrganizationIdAndIdAndStatus(
            UUID organizationId,
            UUID id,
            String status
    );
}
