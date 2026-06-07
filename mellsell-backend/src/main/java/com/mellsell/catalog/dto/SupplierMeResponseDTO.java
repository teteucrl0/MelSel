package com.mellsell.catalog.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierMeResponseDTO {
    private Long id;
    private String name;
    private String email;
    private Boolean active;
    /** true quando o fornecedor ainda não foi aprovado pelo admin (active=false). */
    private Boolean pendingApproval;
}