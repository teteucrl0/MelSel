package com.mellsell.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRecentOrderDTO {
    private Long id;
    private BigDecimal total;
    private String status;
    private String statusLabel;
    private LocalDateTime createdAt;
}