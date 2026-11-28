
package com.atlasone.api.order.repository;

import com.atlasone.api.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findAllByOrganizationIdAndOrderIdOrderByPositionAsc(
            UUID organizationId,
            UUID orderId);

    Optional<OrderItem> findByOrganizationIdAndOrderIdAndId(
            UUID organizationId,
            UUID orderId,
            UUID id);

    void deleteAllByOrganizationIdAndOrderId(
            UUID organizationId,
            UUID orderId);
}
