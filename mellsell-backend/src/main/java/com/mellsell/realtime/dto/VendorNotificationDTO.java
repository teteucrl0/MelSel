package com.mellsell.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorNotificationDTO {
    private Long supplierId;
    private String supplierName;
    private Long orderId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private Integer stockRemaining;
    private String type;
    private String message;
    private String timestamp;
}