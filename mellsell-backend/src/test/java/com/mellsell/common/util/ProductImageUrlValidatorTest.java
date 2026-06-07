package com.mellsell.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductImageUrlValidatorTest {

    @Test
    void acceptsUploadedProductPath() {
        assertEquals(
                "/uploads/products/abc-123.jpg",
                ProductImageUrlValidator.normalize("/uploads/products/abc-123.jpg")
        );
    }

    @Test
    void rejectsExternalUrl() {
        assertThrows(IllegalArgumentException.class, () ->
                ProductImageUrlValidator.normalize("https://evil.example/x.png"));
    }

    @Test
    void rejectsJavascriptScheme() {
        assertThrows(IllegalArgumentException.class, () ->
                ProductImageUrlValidator.normalize("javascript:alert(1)"));
    }

    @Test
    void blankReturnsNull() {
        assertNull(ProductImageUrlValidator.normalize("  "));
    }
}