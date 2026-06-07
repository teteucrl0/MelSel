package com.mellsell.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({com.mellsell.auth.exception.ResourceNotFoundException.class, com.mellsell.catalog.exception.ResourceNotFoundException.class})
    public ResponseEntity<Object> handleNotFound(RuntimeException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Object> handleBadRequest(RuntimeException ex, HttpServletRequest request) {
        log.debug("Bad request on {}: {}", request.getRequestURI(), safeLogMessage(ex));
        return buildResponse(HttpStatus.BAD_REQUEST, clientSafeMessage(ex.getMessage()), request.getRequestURI(), null);
    }

    @ExceptionHandler(com.mellsell.order.exception.SupplierInactiveException.class)
    public ResponseEntity<Object> handleSupplierInactive(com.mellsell.order.exception.SupplierInactiveException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Object> handleMaxUpload(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Imagem muito grande. Máximo 5 MB.", request.getRequestURI(), null);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Object> handleMultipart(MultipartException ex, HttpServletRequest request) {
        String msg = ex.getMessage() != null && ex.getMessage().contains("size")
                ? "Imagem muito grande. Máximo 5 MB."
                : "Falha no envio do arquivo. Tente outra imagem (JPG, PNG, WebP ou GIF).";
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request.getRequestURI(), null);
    }

    @ExceptionHandler(com.mellsell.order.exception.InsufficientStockException.class)
    public ResponseEntity<Object> handleInsufficientStock(com.mellsell.order.exception.InsufficientStockException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleUnreadableJson(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.debug("Unreadable JSON on {}: {}", request.getRequestURI(), ex.getClass().getSimpleName());
        Throwable cause = ex.getMostSpecificCause();
        if (cause instanceof IllegalArgumentException iae && iae.getMessage() != null) {
            return buildResponse(HttpStatus.BAD_REQUEST, clientSafeMessage(iae.getMessage()), request.getRequestURI(), null);
        }
        String msg = "Dados inválidos. Verifique os campos enviados.";
        String raw = ex.getMessage() != null ? ex.getMessage() : "";
        if (raw.contains("LocalDate") || raw.contains("birthDate")) {
            msg = "Data de nascimento inválida. Use o formato dd/mm/aaaa (ex.: 15/05/2000).";
        } else if (raw.contains("LocalDateTime") || raw.contains("validFrom") || raw.contains("validUntil")) {
            msg = "Datas de validade inválidas. Preencha início e fim corretamente.";
        }
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request.getRequestURI(), null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getClass().getSimpleName());
        String msg = resolveIntegrityMessage(ex, request.getRequestURI());
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request.getRequestURI(), null);
    }

    private static String resolveIntegrityMessage(DataIntegrityViolationException ex, String path) {
        String raw = "";
        Throwable cause = ex.getMostSpecificCause();
        if (cause != null && cause.getMessage() != null) {
            raw = cause.getMessage().toLowerCase();
        } else if (ex.getMessage() != null) {
            raw = ex.getMessage().toLowerCase();
        }

        if (raw.contains("email")) {
            return "E-mail já cadastrado.";
        }
        if (raw.contains("coupons") && raw.contains("code")) {
            return "Já existe um cupom com este código. Escolha outro.";
        }
        if (path != null && path.contains("/coupons") && (raw.contains("duplicate") || raw.contains("unique"))) {
            return "Já existe um cupom com este código. Escolha outro.";
        }
        if (raw.contains("duplicate") || raw.contains("unique")) {
            return "Registro duplicado. Verifique os dados informados.";
        }
        if (raw.contains("cannot be null") || raw.contains("not-null") || raw.contains("not null")) {
            return "Preencha todos os campos obrigatórios.";
        }
        return "Não foi possível salvar os dados. Verifique os campos e tente novamente.";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("field", fe.getField());
                    m.put("message", fe.getDefaultMessage());
                    return m;
                })
                .collect(Collectors.toList());
        String summary = errors.stream()
                .map(e -> fieldLabel(e.get("field")) + ": " + e.get("message"))
                .collect(Collectors.joining(" · "));
        if (summary.isBlank()) {
            summary = "Dados inválidos. Verifique os campos.";
        }
        return buildResponse(HttpStatus.BAD_REQUEST, summary, request.getRequestURI(), Collections.singletonMap("errors", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        List<String> errors = ex.getConstraintViolations().stream()
                .map(cv -> fieldLabel(cv.getPropertyPath().toString()) + ": " + cv.getMessage())
                .collect(Collectors.toList());
        String summary = errors.isEmpty() ? "Dados inválidos." : String.join(" · ", errors);
        return buildResponse(HttpStatus.BAD_REQUEST, summary, request.getRequestURI(), Collections.singletonMap("errors", errors));
    }

    private static String fieldLabel(String field) {
        if (field == null) return "Campo";
        return switch (field) {
            case "name" -> "Nome";
            case "price" -> "Preço";
            case "stock" -> "Estoque";
            case "lowStockThreshold" -> "Alerta de estoque";
            case "supplierId" -> "Fornecedor";
            case "description" -> "Descrição";
            case "imageUrl" -> "Imagem";
            case "birthDate" -> "Data de nascimento";
            case "email" -> "E-mail";
            case "password" -> "Senha";
            case "storeName" -> "Nome da loja";
            case "shippingAddress" -> "Endereço de entrega";
            case "paymentMethod" -> "Forma de pagamento";
            case "couponCode" -> "Cupom";
            case "code" -> "Código";
            case "discountPercentage" -> "Desconto";
            case "maxUses" -> "Máximo de usos";
            case "validFrom" -> "Válido de";
            case "validUntil" -> "Válido até";
            case "creditCard" -> "Cartão de crédito";
            case "creditCard.holderName" -> "Nome no cartão";
            case "creditCard.number" -> "Número do cartão";
            case "creditCard.expMonth" -> "Mês de validade";
            case "creditCard.expYear" -> "Ano de validade";
            case "creditCard.cvv" -> "CVV";
            case "creditCard.installments" -> "Parcelas";
            default -> field.contains("creditCard") ? "Cartão de crédito" : field;
        };
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.debug("Access denied on {} for {}", request.getRequestURI(), request.getRemoteUser());
        return buildResponse(HttpStatus.FORBIDDEN, "Acesso negado.", request.getRequestURI(), null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.debug("Authentication failed on {}", request.getRequestURI());
        return buildResponse(HttpStatus.UNAUTHORIZED, "Credenciais inválidas.", request.getRequestURI(), null);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Object> handleDataAccess(DataAccessException ex, HttpServletRequest request) {
        log.error("Database error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao acessar o banco de dados. Tente novamente em instantes.",
                request.getRequestURI(),
                null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro interno no servidor. Tente novamente.",
                request.getRequestURI(),
                null);
    }

    /** Evita vazar PAN/CVV em mensagens de log. */
    private static String safeLogMessage(Throwable ex) {
        if (ex == null || ex.getMessage() == null) {
            return ex != null ? ex.getClass().getSimpleName() : "unknown";
        }
        return ex.getMessage().replaceAll("\\d{13,19}", "[CARD]");
    }

    /** Mensagens seguras ao cliente (sem detalhes de infraestrutura). */
    private static String clientSafeMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Requisição inválida.";
        }
        if (message.contains("run-presentation") || message.contains("jdbc:") || message.contains("SQLException")) {
            return "Requisição inválida.";
        }
        return message;
    }

    private ResponseEntity<Object> buildResponse(HttpStatus status, String message, String path, Map<String, Object> extra) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", path);
        if (extra != null) body.putAll(extra);
        return ResponseEntity.status(status).body(body);
    }
}