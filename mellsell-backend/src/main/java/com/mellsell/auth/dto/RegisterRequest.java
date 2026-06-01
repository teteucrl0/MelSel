package com.mellsell.auth.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, message = "Senha deve ter ao menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Senha deve conter maiúscula, minúscula, número e caractere especial")
    private String password;

    @NotNull(message = "Idade é obrigatória")
    @Min(value = 21, message = "Você deve ter no mínimo 21 anos")
    @Max(value = 150, message = "Idade inválida")
    private Integer age;

    private String storeName;
}
