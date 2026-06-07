package com.mellsell.common.util;

import java.util.regex.Pattern;

/**
 * Restringe imageUrl a caminhos gerados pelo upload local (evita javascript:, URLs externas maliciosas).
 */
public final class ProductImageUrlValidator {

    private static final Pattern ALLOWED_PATH = Pattern.compile(
            "^/uploads/(products|avatars)/[a-zA-Z0-9._-]+\\.(jpg|jpeg|png|webp|gif)$",
            Pattern.CASE_INSENSITIVE
    );

    private ProductImageUrlValidator() {}

    public static String normalize(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String trimmed = imageUrl.trim();
        if (!ALLOWED_PATH.matcher(trimmed).matches()) {
            throw new IllegalArgumentException(
                    "URL de imagem inválida. Envie a foto pelo upload da plataforma."
            );
        }
        return trimmed;
    }
}