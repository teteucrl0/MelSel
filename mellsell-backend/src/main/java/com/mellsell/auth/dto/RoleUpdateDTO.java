package com.mellsell.auth.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleUpdateDTO {
    @NotEmpty(message = "roles é obrigatório")
    private Set<String> roles;
}
