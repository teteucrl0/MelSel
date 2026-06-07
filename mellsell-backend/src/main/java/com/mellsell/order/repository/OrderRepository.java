package com.mellsell.order.repository;

import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);

    @Query("SELECT o FROM Order o WHERE o.status = 'CONFIRMED' AND (:from IS NULL OR o.createdAt >= :from) AND (:to IS NULL OR o.createdAt <= :to)")
    List<Order> findConfirmedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Order> findBySupplierIdAndStatusAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
            Long supplierId,
            OrderStatus status,
            LocalDateTime from);

    List<Order> findBySupplierIdAndStatusOrderByCreatedAtDesc(
            Long supplierId,
            OrderStatus status,
            Pageable pageable);
}
