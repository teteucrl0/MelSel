package com.mellsell.report.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReportItemDTO {
    private Long productId;
    private String productName;
    private Long quantitySold;
    private BigDecimal revenue;
}
