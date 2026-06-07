package com.mellsell.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 120, message = "Nome muito longo")
    private String name;

    private LocalDate birthDate;

    @Size(max = 120, message = "Nome da loja muito longo")
    private String storeName;
}