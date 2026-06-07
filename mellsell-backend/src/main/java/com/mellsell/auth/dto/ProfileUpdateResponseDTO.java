package com.mellsell.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateResponseDTO {
    private UserProfileResponseDTO profile;
    private String token;
    private String displayName;
}