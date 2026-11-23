
package com.atlasone.api.organization.repository;

import com.atlasone.api.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository
        extends JpaRepository<Organization, UUID> {

    Optional<Organization> findBySlugAndStatus(
            String slug,
            String status
    );
}
