package com.mellsell.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationResponse {
    private String token;
    private String tokenType = "Bearer";
    private String displayName;
    private String email;
    private java.util.Set<String> roles;
    /** Fornecedor aprovado no catálogo (null se não for apicultor). */
    private Boolean supplierActive;
    /** Aguardando aprovação admin (null se não for apicultor). */
    private Boolean pendingApproval;
}
