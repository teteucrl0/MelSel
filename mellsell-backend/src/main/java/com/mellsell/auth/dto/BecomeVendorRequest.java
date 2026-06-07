package com.mellsell.auth.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BecomeVendorRequest {

    @NotBlank(message = "Informe o nome da sua loja ou apiário")
    @Size(min = 3, max = 120, message = "Nome da loja deve ter entre 3 e 120 caracteres")
    private String storeName;

    @NotBlank(message = "Descreva sua loja ou apiário")
    @Size(max = 2000)
    @Pattern(
            regexp = "^[\\p{L}0-9 .,!?'\\-\\n\\r]+$",
            message = "Descrição da loja contém caracteres não permitidos"
    )
    private String supplierDescription;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 80)
    @Pattern(
            regexp = "^[\\p{L}0-9 .,'\\-/ºª°#\\-]+$",
            message = "Cidade contém caracteres não permitidos"
    )
    private String supplierCity;

    @NotBlank(message = "UF é obrigatória")
    @Size(min = 2, max = 2)
    @Pattern(regexp = "^[A-Za-z]{2}$", message = "UF inválida")
    private String supplierState;
}