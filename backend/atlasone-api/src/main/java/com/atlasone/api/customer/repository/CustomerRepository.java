
package com.atlasone.api.customer.repository;

import com.atlasone.api.customer.entity.Customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository
        extends JpaRepository<Customer, UUID> {

    List<Customer> findAllByOrganizationIdOrderByNameAsc(
            UUID organizationId);

    Optional<Customer> findByOrganizationIdAndId(
            UUID organizationId,
            UUID id);

    Optional<Customer> findByOrganizationIdAndDocument(
            UUID organizationId,
            String document);
}
