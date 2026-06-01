package com.mellsell.auth.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private Boolean active;
    private Boolean locked;
    private Integer failedLoginAttempts;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
