package com.mellsell.catalog.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponDTO {
    private Long id;
    private String code;
    private Double discountPercentage;
    private Integer maxUses;
    private Integer usedCount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean active;
}
