package com.mellsell.catalog.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProductDTO {

    @NotBlank(message = "Nome é obrigatório")
    private String name;

    private String description;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser >= 0.01")
    private BigDecimal price;

    @NotNull(message = "Estoque é obrigatório")
    @Min(value = 0, message = "Estoque não pode ser negativo")
    private Integer stock;

    @NotNull(message = "Threshold de estoque baixo é obrigatório")
    @Min(value = 0, message = "Threshold não pode ser negativo")
    private Integer lowStockThreshold;

    @NotNull(message = "Flag ativo é obrigatório")
    private Boolean active;
}
