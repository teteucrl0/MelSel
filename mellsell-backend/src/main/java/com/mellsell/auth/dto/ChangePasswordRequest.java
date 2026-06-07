package com.mellsell.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "Informe a senha atual")
    private String currentPassword;

    @NotBlank
    @Size(min = 8, message = "Senha deve ter ao menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Senha deve conter maiúscula, minúscula, número e caractere especial"
    )
    private String newPassword;
}