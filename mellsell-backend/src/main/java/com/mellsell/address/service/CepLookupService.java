package com.mellsell.address.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.mellsell.address.dto.AddressByCepResponseDTO;
import com.mellsell.common.util.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class CepLookupService {

    private static final String VIACEP_URL = "https://viacep.com.br/ws/{cep}/json/";
    private final RestTemplate restTemplate = new RestTemplate();

    public AddressByCepResponseDTO lookup(String rawCep) {
        String cep = InputSanitizer.requireSafeCep(rawCep);

        JsonNode body;
        try {
            body = restTemplate.getForObject(VIACEP_URL, JsonNode.class, cep);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Serviço de CEP temporariamente indisponível. Tente novamente.");
        }
        if (body == null || body.has("erro")) {
            throw new IllegalArgumentException("CEP não encontrado.");
        }

        return AddressByCepResponseDTO.builder()
                .cep(formatCep(cep))
                .street(text(body, "logradouro"))
                .complement(text(body, "complemento"))
                .neighborhood(text(body, "bairro"))
                .city(text(body, "localidade"))
                .state(text(body, "uf"))
                .ibge(text(body, "ibge"))
                .source("viacep")
                .build();
    }

    private static String formatCep(String digits) {
        return digits.substring(0, 5) + "-" + digits.substring(5);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }
}