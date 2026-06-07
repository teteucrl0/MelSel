package com.mellsell.auth.dto;

import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BecomeVendorResponseDTO {
    private UserProfileResponseDTO profile;
    private String token;
    private String displayName;
    private Set<String> roles;
    private boolean pendingApproval;
}