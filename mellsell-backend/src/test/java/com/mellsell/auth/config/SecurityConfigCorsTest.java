package com.mellsell.auth.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Garante que clientes na rede local (outro IP) podem chamar a API com CORS.
 */
class SecurityConfigCorsTest {

    private CorsConfiguration config;

    @BeforeEach
    void setUp() {
        SecurityConfig securityConfig = new SecurityConfig(new MellsellCorsProperties(""));
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        config = source.getCorsConfiguration(request);
        assertNotNull(config);
    }

    @Test
    void allowsLocalhostOrigin() {
        assertEquals("http://localhost:5173", config.checkOrigin("http://localhost:5173"));
    }

    @Test
    void allowsLan192168Origin() {
        assertEquals("http://192.168.1.42:5173", config.checkOrigin("http://192.168.1.42:5173"));
        assertEquals("http://192.168.0.15:5173", config.checkOrigin("http://192.168.0.15:5173"));
    }

    @Test
    void allowsLan10Origin() {
        assertEquals("http://10.0.0.8:5173", config.checkOrigin("http://10.0.0.8:5173"));
    }

    @Test
    void allowsLan17216Origin() {
        assertEquals("http://172.16.0.5:5173", config.checkOrigin("http://172.16.0.5:5173"));
    }

    @Test
    void allowsLan17217Origin() {
        assertEquals("http://172.17.138.130:5173", config.checkOrigin("http://172.17.138.130:5173"));
    }

    @Test
    void rejectsPublicInternetOrigin() {
        assertNull(config.checkOrigin("http://evil.example.com:5173"));
        assertNull(config.checkOrigin("https://192.168.1.1:5173"));
    }

    @Test
    void allowsCredentials() {
        assertEquals(Boolean.TRUE, config.getAllowCredentials());
    }
}