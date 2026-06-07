package com.mellsell.auth.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private Integer age;
    private LocalDate birthDate;
    private String storeName;
    private Set<String> roles;
    private boolean vendor;
}