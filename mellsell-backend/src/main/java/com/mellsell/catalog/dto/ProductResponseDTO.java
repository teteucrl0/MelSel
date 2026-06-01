package com.mellsell.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private Integer lowStockThreshold;
    private Boolean active;
    private Long supplierId;
    private String supplierName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
