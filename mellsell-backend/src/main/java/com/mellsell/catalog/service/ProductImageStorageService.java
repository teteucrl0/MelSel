package com.mellsell.catalog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductImageStorageService {

    private static final Set<String> ALLOWED = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/x-webp"
    );
    private static final long MAX_BYTES = 5 * 1024 * 1024;

    private final Path productsDir;
    private final Path avatarsDir;

    public ProductImageStorageService(@Value("${mellsell.upload.dir:uploads}") String uploadDir) throws IOException {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.productsDir = base.resolve("products");
        this.avatarsDir = base.resolve("avatars");
        Files.createDirectories(productsDir);
        Files.createDirectories(avatarsDir);
    }

    public String store(MultipartFile file) {
        return store(file, productsDir, "/uploads/products/");
    }

    public String storeAvatar(MultipartFile file) {
        return store(file, avatarsDir, "/uploads/avatars/");
    }

    private String store(MultipartFile file, Path dir, String publicPrefix) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Selecione uma imagem para enviar.");
        }

        final byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao ler imagem.", e);
        }

        if (data.length == 0) {
            throw new IllegalArgumentException("Arquivo de imagem vazio.");
        }
        if (data.length > MAX_BYTES) {
            throw new IllegalArgumentException("Imagem muito grande. Máximo 5 MB.");
        }

        String contentType = resolveContentType(file, data);
        if (contentType == null) {
            throw new IllegalArgumentException("Formato inválido. Use JPG, PNG, WebP ou GIF.");
        }

        String extension = extensionForContentType(contentType);
        String filename = UUID.randomUUID() + "." + extension;
        Path target = dir.resolve(filename);
        try {
            Files.write(target, data);
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao salvar imagem.", e);
        }
        return publicPrefix + filename;
    }

    private String resolveContentType(MultipartFile file, byte[] data) {
        String fromMeta = contentTypeFromMetadata(file);
        if (fromMeta != null) return fromMeta;
        return detectFromMagic(data);
    }

    private static String contentTypeFromMetadata(MultipartFile file) {
        String raw = file.getContentType();
        if (raw != null && !raw.isBlank()) {
            String normalized = raw.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
            if (ALLOWED.contains(normalized)) {
                return canonicalContentType(normalized);
            }
            if ("application/octet-stream".equals(normalized)) {
                String fromName = contentTypeFromFilename(file.getOriginalFilename());
                if (fromName != null) return fromName;
            }
        }
        return contentTypeFromFilename(file.getOriginalFilename());
    }

    private static String contentTypeFromFilename(String filename) {
        if (filename == null || !filename.contains(".")) return null;
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            default -> null;
        };
    }

    /** Detecta formato pelos primeiros bytes (funciona mesmo sem extensão ou Content-Type). */
    private static String detectFromMagic(byte[] data) {
        if (data.length >= 12
                && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return "image/webp";
        }
        if (data.length >= 8
                && (data[0] & 0xFF) == 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') {
            return "image/png";
        }
        if (data.length >= 3
                && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (data.length >= 6
                && data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8') {
            return "image/gif";
        }
        return null;
    }

    private static String canonicalContentType(String contentType) {
        return switch (contentType) {
            case "image/jpg" -> "image/jpeg";
            case "image/x-webp" -> "image/webp";
            default -> contentType;
        };
    }

    private static String extensionForContentType(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "jpg";
        };
    }
}