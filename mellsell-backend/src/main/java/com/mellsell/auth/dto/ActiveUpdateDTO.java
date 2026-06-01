package com.mellsell.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveUpdateDTO {
    @NotNull(message = "active é obrigatório")
    private Boolean active;
}
