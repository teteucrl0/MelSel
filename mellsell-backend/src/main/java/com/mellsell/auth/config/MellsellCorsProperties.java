package com.mellsell.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class MellsellCorsProperties {

    private static final List<String> DEV_ORIGIN_PATTERNS = List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://[::1]:*",
            "http://192.168.*.*:*",
            "http://10.*.*.*:*",
            "http://172.*.*.*:*"
    );

    private final List<String> allowedOriginPatterns;

    public MellsellCorsProperties(
            @Value("${mellsell.cors.allowed-origin-patterns:}") String extraPatterns
    ) {
        if (extraPatterns == null || extraPatterns.isBlank()) {
            this.allowedOriginPatterns = DEV_ORIGIN_PATTERNS;
        } else {
            this.allowedOriginPatterns = Arrays.stream(extraPatterns.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
    }

    public List<String> getAllowedOriginPatterns() {
        return allowedOriginPatterns;
    }
}