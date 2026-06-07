package com.mellsell.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutResponseDTO {
    private List<OrderResponseDTO> orders;
    private BigDecimal totalPaid;
    private int orderCount;
}