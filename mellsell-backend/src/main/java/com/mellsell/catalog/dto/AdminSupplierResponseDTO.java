package com.mellsell.catalog.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSupplierResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String city;
    private String state;
    /** Trecho da descrição (até ~120 caracteres), quando existir. */
    private String descriptionSnippet;
    private Boolean active;
    private LocalDateTime createdAt;
    private String ownerEmail;
}