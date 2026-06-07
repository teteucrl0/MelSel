package com.mellsell.address.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressByCepResponseDTO {
    private String cep;
    private String street;
    private String complement;
    private String neighborhood;
    private String city;
    private String state;
    private String ibge;
    private String source;
}