package com.mellsell.payment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditCardDto {

    @NotBlank(message = "Informe o nome impresso no cartão")
    @Size(min = 2, max = 80, message = "Nome no cartão deve ter entre 2 e 80 caracteres")
    private String holderName;

    /** Apenas dígitos (13–19). */
    @NotBlank(message = "Informe o número do cartão")
    @Pattern(regexp = "\\d{13,19}", message = "Número do cartão deve conter apenas 13 a 19 dígitos")
    private String number;

    @NotBlank(message = "Informe o mês de validade (MM)")
    @Pattern(regexp = "0[1-9]|1[0-2]", message = "Mês de validade inválido (use 01 a 12)")
    private String expMonth;

    @NotBlank(message = "Informe o ano de validade")
    @Pattern(regexp = "\\d{2,4}", message = "Ano de validade inválido")
    private String expYear;

    @NotBlank(message = "Informe o CVV")
    @Pattern(regexp = "\\d{3,4}", message = "CVV deve ter 3 ou 4 dígitos")
    private String cvv;

    /** Parcelas no cartão (1 = à vista, até 6x). */
    @NotNull(message = "Informe o número de parcelas")
    @Min(value = 1, message = "Mínimo de 1 parcela")
    @Max(value = 6, message = "Máximo de 6 parcelas")
    private Integer installments = 1;
}