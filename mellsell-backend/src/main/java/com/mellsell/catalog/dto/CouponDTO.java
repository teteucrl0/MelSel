package com.mellsell.catalog.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponDTO {
    private Long id;

    @NotBlank(message = "Informe o código do cupom.")
    @Size(min = 2, max = 100, message = "Código deve ter entre 2 e 100 caracteres.")
    private String code;

    @NotNull(message = "Informe o percentual de desconto.")
    @DecimalMin(value = "0.01", message = "Desconto deve ser maior que zero.")
    @DecimalMax(value = "100", message = "Desconto não pode passar de 100%.")
    private Double discountPercentage;

    @NotNull(message = "Informe o máximo de usos.")
    @Min(value = 1, message = "Máximo de usos deve ser pelo menos 1.")
    private Integer maxUses;

    private Integer usedCount;

    @NotNull(message = "Informe a data de início da validade.")
    private LocalDateTime validFrom;

    @NotNull(message = "Informe a data de fim da validade.")
    private LocalDateTime validUntil;

    private Boolean active;
}
