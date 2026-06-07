package com.mellsell.address.controller;

import com.mellsell.address.dto.AddressByCepResponseDTO;
import com.mellsell.address.service.CepLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/address")
@RequiredArgsConstructor
public class AddressController {

    private final CepLookupService cepLookupService;

    /**
     * Consulta endereço pelo CEP (ViaCEP — serviço público usado com padrão dos Correios).
     */
    @GetMapping("/cep/{cep}")
    public AddressByCepResponseDTO lookupCep(@PathVariable String cep) {
        return cepLookupService.lookup(cep);
    }
}