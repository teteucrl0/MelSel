package com.mellsell.order.repository;

import com.mellsell.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
            SELECT COALESCE(SUM(oi.subtotal), 0) FROM OrderItem oi, Product p, Order o
            WHERE oi.productId = p.id AND oi.order = o AND p.supplier.id = :supplierId
            AND o.status = com.mellsell.order.entity.OrderStatus.CONFIRMED
            """)
    BigDecimal sumRevenueBySupplier(@Param("supplierId") Long supplierId);

    @Query("""
            SELECT COUNT(DISTINCT o.id) FROM OrderItem oi, Product p, Order o
            WHERE oi.productId = p.id AND oi.order = o AND p.supplier.id = :supplierId
            AND o.status = com.mellsell.order.entity.OrderStatus.CONFIRMED
            """)
    long countOrdersBySupplier(@Param("supplierId") Long supplierId);
}
