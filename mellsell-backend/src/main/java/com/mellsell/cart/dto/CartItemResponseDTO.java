package com.mellsell.cart.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponseDTO {
    private Long id;
    private Long productId;
    private Long supplierId;
    private String supplierName;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    /** Estoque disponível após a operação (para atualizar a vitrine em tempo real). */
    private Integer stockRemaining;
}
