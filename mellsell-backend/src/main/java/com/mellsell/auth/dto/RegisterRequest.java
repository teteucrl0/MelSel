package com.mellsell.auth.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mellsell.common.jackson.LocalDateBrDeserializer;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Nome completo é obrigatório")
    @Size(min = 5, max = 120, message = "Nome completo deve ter entre 5 e 120 caracteres")
    @Pattern(
            regexp = "^[\\p{L}0-9][\\p{L}0-9 .'\\-]*\\s+[\\p{L}0-9][\\p{L}0-9 .'\\-]*$",
            message = "Informe nome e sobrenome separados por espaço"
    )
    private String name;

    @Email(message = "E-mail inválido")
    @NotBlank(message = "E-mail é obrigatório")
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(min = 8, message = "Senha deve ter ao menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Senha deve conter maiúscula, minúscula, número e caractere especial"
    )
    private String password;

    @NotNull(message = "Data de nascimento é obrigatória")
    @JsonDeserialize(using = LocalDateBrDeserializer.class)
    private LocalDate birthDate;

    @Size(max = 120)
    @Pattern(
            regexp = "^$|^[\\p{L}0-9 .'\\-&]+$",
            message = "Nome da loja contém caracteres não permitidos"
    )
    private String storeName;

    @Size(max = 2000)
    @Pattern(
            regexp = "^$|^[\\p{L}0-9 .,!?'\\-\\n\\r]+$",
            message = "Descrição da loja contém caracteres não permitidos"
    )
    private String supplierDescription;

    @Size(max = 80)
    @Pattern(
            regexp = "^$|^[\\p{L}0-9 .,'\\-/ºª°#\\-]+$",
            message = "Cidade contém caracteres não permitidos"
    )
    private String supplierCity;

    @Size(max = 2)
    @Pattern(
            regexp = "^$|^[A-Za-z]{2}$",
            message = "UF inválida"
    )
    private String supplierState;
}
