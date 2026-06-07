package com.mellsell.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockUpdateDTO {
    private Long productId;
    private String productName;
    private Integer stock;
    private Long supplierId;
}
