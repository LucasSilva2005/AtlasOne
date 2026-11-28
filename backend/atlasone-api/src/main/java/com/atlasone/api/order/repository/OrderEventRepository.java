package com.atlasone.api.order.repository;

import com.atlasone.api.order.entity.OrderEvent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderEventRepository extends JpaRepository<OrderEvent, UUID> {

    List<OrderEvent> findAllByOrganizationIdAndOrderIdOrderByOccurredAtAsc(
            UUID organizationId,
            UUID orderId
    );

    Optional<OrderEvent> findByOrganizationIdAndId(
            UUID organizationId,
            UUID id
    );

    Optional<OrderEvent> findByOrganizationIdAndSourceAndExternalEventId(
            UUID organizationId,
            String source,
            String externalEventId
    );
}
