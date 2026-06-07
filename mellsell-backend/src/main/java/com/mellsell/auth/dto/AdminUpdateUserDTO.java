package com.mellsell.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 120)
    private String name;

    @Size(max = 120)
    private String storeName;
}