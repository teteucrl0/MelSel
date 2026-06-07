package com.mellsell.order.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mellsell.payment.dto.CreditCardDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotBlank(message = "Informe o endereço de entrega")
    private String shippingAddress;

    @NotBlank(message = "Informe a forma de pagamento")
    @Pattern(regexp = "FAKE|CREDIT_CARD", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Forma de pagamento deve ser FAKE ou CREDIT_CARD")
    private String paymentMethod;

    private String couponCode;

    /** Obrigatório quando paymentMethod = CREDIT_CARD. */
    @Valid
    private CreditCardDto creditCard;

    @JsonIgnore
    @AssertTrue(message = "Informe os dados do cartão de crédito")
    public boolean isCreditCardValidForMethod() {
        if (paymentMethod == null) {
            return true;
        }
        if (!"CREDIT_CARD".equalsIgnoreCase(paymentMethod.trim())) {
            return true;
        }
        return creditCard != null;
    }
}