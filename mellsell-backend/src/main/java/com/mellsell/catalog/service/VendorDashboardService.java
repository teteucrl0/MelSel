package com.mellsell.catalog.service;

import com.mellsell.catalog.dto.VendorDashboardStatsDTO;
import com.mellsell.catalog.dto.VendorRecentOrderDTO;
import com.mellsell.catalog.dto.VendorSalesDayDTO;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderStatus;
import com.mellsell.order.repository.OrderItemRepository;
import com.mellsell.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VendorDashboardService {

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public VendorDashboardStatsDTO buildStats(Supplier supplier) {
        Long supplierId = supplier.getId();
        BigDecimal revenue = orderItemRepository.sumRevenueBySupplier(supplierId);
        long orders = orderItemRepository.countOrdersBySupplier(supplierId);
        int products = (int) productRepository.findBySupplierIdOrderByCreatedAtDesc(
                supplierId,
                PageRequest.of(0, 1)
        ).getTotalElements();

        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = today.minusDays(6).atStartOfDay();
        List<Order> weekOrders = orderRepository.findBySupplierIdAndStatusAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
                supplierId,
                OrderStatus.CONFIRMED,
                weekStart);

        Map<LocalDate, BigDecimal> revenueByDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            revenueByDay.put(today.minusDays(i), BigDecimal.ZERO);
        }
        for (Order order : weekOrders) {
            if (order.getCreatedAt() == null || order.getTotal() == null) {
                continue;
            }
            LocalDate day = order.getCreatedAt().toLocalDate();
            if (revenueByDay.containsKey(day)) {
                revenueByDay.merge(day, order.getTotal(), BigDecimal::add);
            }
        }

        List<VendorSalesDayDTO> salesLast7Days = new ArrayList<>();
        BigDecimal revenueLast7Days = BigDecimal.ZERO;
        for (Map.Entry<LocalDate, BigDecimal> entry : revenueByDay.entrySet()) {
            BigDecimal dayRevenue = entry.getValue() != null ? entry.getValue() : BigDecimal.ZERO;
            salesLast7Days.add(VendorSalesDayDTO.builder()
                    .date(entry.getKey())
                    .revenue(dayRevenue)
                    .build());
            revenueLast7Days = revenueLast7Days.add(dayRevenue);
        }

        List<VendorRecentOrderDTO> recentOrders = orderRepository
                .findBySupplierIdAndStatusOrderByCreatedAtDesc(
                        supplierId,
                        OrderStatus.CONFIRMED,
                        PageRequest.of(0, 5))
                .stream()
                .map(this::toRecentOrderDto)
                .toList();

        return VendorDashboardStatsDTO.builder()
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalOrders(orders)
                .productCount(products)
                .revenueLast7Days(revenueLast7Days)
                .salesLast7Days(salesLast7Days)
                .recentOrders(recentOrders)
                .build();
    }

    private VendorRecentOrderDTO toRecentOrderDto(Order order) {
        return VendorRecentOrderDTO.builder()
                .id(order.getId())
                .total(order.getTotal())
                .status(order.getStatus().name())
                .statusLabel(statusLabel(order))
                .createdAt(order.getCreatedAt())
                .build();
    }

    private static String statusLabel(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return "Cancelado";
        }
        if (order.getStatus() == OrderStatus.PENDING) {
            return "Pendente";
        }
        int steps = order.getTrackingStepsCompleted() != null ? order.getTrackingStepsCompleted() : 0;
        if (steps >= 5) {
            return "Entregue";
        }
        if (steps >= 2) {
            return "Em trânsito";
        }
        return "Confirmado";
    }
}