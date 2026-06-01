package com.mellsell.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotBlank
    private String shippingAddress;

    @NotBlank
    private String paymentMethod;
}
