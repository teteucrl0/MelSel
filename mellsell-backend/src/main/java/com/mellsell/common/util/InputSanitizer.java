package com.mellsell.common.util;

import java.util.regex.Pattern;

/**
 * Validação de texto de entrada — complementa JPA (consultas parametrizadas) bloqueando padrões de injeção.
 */
public final class InputSanitizer {

    private static final Pattern SAFE_NAME = Pattern.compile("^[\\p{L}0-9 .'\\-]{2,120}$");
    private static final Pattern SAFE_STORE = Pattern.compile("^[\\p{L}0-9 .'\\-&]{0,120}$");
    private static final Pattern SAFE_PRODUCT_NAME = Pattern.compile("^[\\p{L}0-9 .'\\-&]{2,120}$");
    private static final Pattern SAFE_ADDRESS_LINE = Pattern.compile("^[\\p{L}0-9 .,'\\-/ºª°#]{0,120}$");
    private static final Pattern SAFE_ADDRESS_NUMBER = Pattern.compile("^[\\p{L}0-9 ./\\-]{1,20}$");
    private static final Pattern SAFE_SHIPPING = Pattern.compile("^[\\p{L}0-9 .,'\\-/ºª°#()\\n—]{10,500}$");
    private static final Pattern CEP_DIGITS = Pattern.compile("^\\d{8}$");
    private static final Pattern SAFE_DESCRIPTION = Pattern.compile("^[\\p{L}0-9 .,!?'\\-\\n\\r]{0,2000}$");
    private static final Pattern SAFE_REVIEW = Pattern.compile("^[\\p{L}0-9 .,!?'\\-\\n\\r]{1,1000}$");
    /** Palavras SQL inteiras — evita falsos positivos em nomes como "Valter", "Walter". */
    private static final Pattern SQL_KEYWORD = Pattern.compile(
            "\\b(alter|create|delete|drop|exec|execute|insert|select|union|update)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final String[] FORBIDDEN_FRAGMENTS = {
            "--", ";", "/*", "*/", "@@", "char(", "nchar(", "varchar(", "nvarchar(", "xp_", "<script"
    };

    private InputSanitizer() {}

    public static String requireSafeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome completo é obrigatório.");
        }
        String trimmed = name.trim().replaceAll("\\s+", " ");
        rejectDangerousFragments(trimmed, "Nome");
        if (!SAFE_NAME.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Nome contém caracteres não permitidos. Use apenas letras, números, espaços e hífen.");
        }
        if (!trimmed.contains(" ")) {
            throw new IllegalArgumentException("Informe o nome completo (nome e sobrenome, separados por espaço).");
        }
        String[] parts = trimmed.split(" ");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Informe pelo menos nome e sobrenome.");
        }
        for (String part : parts) {
            if (part.length() < 2) {
                throw new IllegalArgumentException("Cada parte do nome deve ter pelo menos 2 caracteres.");
            }
        }
        return trimmed;
    }

    public static String safeStoreName(String storeName) {
        if (storeName == null || storeName.isBlank()) {
            return null;
        }
        String trimmed = storeName.trim();
        rejectDangerousFragments(trimmed, "Nome da loja");
        if (!SAFE_STORE.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Nome da loja contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }
        String trimmed = email.trim().toLowerCase();
        rejectDangerousFragments(trimmed, "E-mail");
        return trimmed;
    }

    public static String requireSafeCep(String rawCep) {
        if (rawCep == null) {
            throw new IllegalArgumentException("CEP é obrigatório.");
        }
        String digits = rawCep.replaceAll("\\D", "");
        rejectDangerousFragments(digits, "CEP");
        if (!CEP_DIGITS.matcher(digits).matches()) {
            throw new IllegalArgumentException("CEP deve conter 8 dígitos.");
        }
        return digits;
    }

    public static String requireSafeAddressLine(String line, String fieldLabel, boolean required) {
        if (line == null || line.isBlank()) {
            if (required) {
                throw new IllegalArgumentException(fieldLabel + " é obrigatório.");
            }
            return "";
        }
        String trimmed = line.trim().replaceAll("\\s+", " ");
        rejectDangerousFragments(trimmed, fieldLabel);
        if (!SAFE_ADDRESS_LINE.matcher(trimmed).matches()) {
            throw new IllegalArgumentException(fieldLabel + " contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeAddressNumber(String number) {
        if (number == null || number.isBlank()) {
            throw new IllegalArgumentException("Número é obrigatório.");
        }
        String trimmed = number.trim();
        rejectDangerousFragments(trimmed, "Número");
        if (!SAFE_ADDRESS_NUMBER.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Número contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeShippingAddress(String address) {
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Endereço de entrega é obrigatório.");
        }
        String trimmed = address.trim().replaceAll("[ \\t]+", " ").replaceAll("\\n{3,}", "\n\n");
        rejectDangerousFragments(trimmed, "Endereço");
        if (!SAFE_SHIPPING.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Endereço contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeProductName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome do produto é obrigatório.");
        }
        String trimmed = name.trim().replaceAll("\\s+", " ");
        rejectDangerousFragments(trimmed, "Nome do produto");
        if (!SAFE_PRODUCT_NAME.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Nome do produto contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String safeProductDescription(String description) {
        if (description == null || description.isBlank()) {
            return "";
        }
        String trimmed = description.trim();
        rejectDangerousFragments(trimmed, "Descrição");
        if (!SAFE_DESCRIPTION.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Descrição contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeBrazilianState(String state) {
        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("UF é obrigatória.");
        }
        String trimmed = state.trim().toUpperCase();
        rejectDangerousFragments(trimmed, "UF");
        if (!Pattern.compile("^[A-Z]{2}$").matcher(trimmed).matches()) {
            throw new IllegalArgumentException("UF inválida.");
        }
        return trimmed;
    }

    public static String requireSafeStoreName(String storeName) {
        if (storeName == null || storeName.isBlank()) {
            throw new IllegalArgumentException("Informe o nome da sua loja ou apiário");
        }
        String trimmed = storeName.trim();
        if (trimmed.length() < 3) {
            throw new IllegalArgumentException("Nome da loja deve ter pelo menos 3 caracteres");
        }
        rejectDangerousFragments(trimmed, "Nome da loja");
        if (!SAFE_STORE.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Nome da loja contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String safeReviewComment(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }
        String trimmed = comment.trim();
        rejectDangerousFragments(trimmed, "Comentário");
        if (!SAFE_REVIEW.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Comentário contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeSupplierDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Descreva sua loja ou apiário.");
        }
        String trimmed = description.trim();
        if (trimmed.length() < 20) {
            throw new IllegalArgumentException("Descrição deve ter pelo menos 20 caracteres.");
        }
        rejectDangerousFragments(trimmed, "Descrição da loja");
        if (!SAFE_DESCRIPTION.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Descrição da loja contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeSupplierCity(String city) {
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("Cidade é obrigatória.");
        }
        String trimmed = city.trim().replaceAll("\\s+", " ");
        if (trimmed.length() < 2) {
            throw new IllegalArgumentException("Cidade deve ter pelo menos 2 caracteres.");
        }
        rejectDangerousFragments(trimmed, "Cidade");
        if (!SAFE_ADDRESS_LINE.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Cidade contém caracteres não permitidos.");
        }
        return trimmed;
    }

    public static String requireSafeSupplierState(String state) {
        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("UF é obrigatória.");
        }
        String trimmed = state.trim().toUpperCase();
        rejectDangerousFragments(trimmed, "UF");
        if (!trimmed.matches("^[A-Z]{2}$")) {
            throw new IllegalArgumentException("UF deve ter 2 letras (ex.: SP).");
        }
        return trimmed;
    }

    private static void rejectDangerousFragments(String value, String fieldLabel) {
        String lower = value.toLowerCase();
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            if (lower.contains(fragment)) {
                throw new IllegalArgumentException(fieldLabel + " contém texto não permitido.");
            }
        }
        if (SQL_KEYWORD.matcher(value).find()) {
            throw new IllegalArgumentException(fieldLabel + " contém texto não permitido.");
        }
    }
}