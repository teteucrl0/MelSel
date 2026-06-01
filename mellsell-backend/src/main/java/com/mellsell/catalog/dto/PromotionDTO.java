package com.mellsell.catalog.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionDTO {
    private Long id;
    private String name;
    private Long productId;
    private String productName;
    private Double discountPercentage;
    private Double discountFixed;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean active;
}
