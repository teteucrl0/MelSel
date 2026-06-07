package com.mellsell.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {
    private Long id;
    private String status;
    private BigDecimal total;
    private BigDecimal shippingCost;
    private BigDecimal discount;
    private String shippingAddress;
    private Long supplierId;
    private String supplierName;
    private String trackingCode;
    private String carrier;
    private String deliveryStatus;
    private Integer deliveryProgress;
    private List<OrderItemDTO> items;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDTO {
        private Long productId;
        private Long supplierId;
        private String supplierName;
        private String productName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }
}
