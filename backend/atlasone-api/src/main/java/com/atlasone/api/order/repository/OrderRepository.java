
package com.atlasone.api.order.repository;

import com.atlasone.api.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<Order> findByOrganizationIdAndId(UUID organizationId, UUID id);

    Optional<Order> findByOrganizationIdAndSourceAndExternalOrderId(
            UUID organizationId,
            String source,
            String externalOrderId);
}
