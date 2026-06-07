package com.mellsell.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InputSanitizerTest {

    @Test
    void acceptsNamesWithSqlSubstrings() {
        assertEquals("Valter Viado", InputSanitizer.requireSafeName("Valter Viado"));
        assertEquals("Walter Silva", InputSanitizer.requireSafeName("  Walter   Silva  "));
    }

    @Test
    void rejectsSqlKeywordsAsWholeWords() {
        assertThrows(IllegalArgumentException.class, () -> InputSanitizer.requireSafeName("Robert Drop"));
    }

    @Test
    void rejectsInjectionFragments() {
        assertThrows(IllegalArgumentException.class, () -> InputSanitizer.requireSafeName("João --"));
    }

    @Test
    void validatesCepProductAndReview() {
        assertEquals("01310100", InputSanitizer.requireSafeCep("01310-100"));
        assertEquals("Mel Premium", InputSanitizer.requireSafeProductName("Mel Premium"));
        assertEquals("Excelente!", InputSanitizer.safeReviewComment("Excelente!"));
        assertThrows(IllegalArgumentException.class, () -> InputSanitizer.requireSafeCep("'; DROP--"));
        assertThrows(IllegalArgumentException.class,
                () -> InputSanitizer.safeReviewComment("<script>alert(1)</script>"));
    }

    @Test
    void validatesShippingAddress() {
        String ok = "Rua A, 10 — Centro - São Paulo/SP — CEP 01310-100";
        assertDoesNotThrow(() -> InputSanitizer.requireSafeShippingAddress(ok));
        assertThrows(IllegalArgumentException.class,
                () -> InputSanitizer.requireSafeShippingAddress("short"));
    }
}