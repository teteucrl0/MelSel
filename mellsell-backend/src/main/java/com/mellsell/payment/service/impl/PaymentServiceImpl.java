package com.mellsell.payment.service.impl;

import com.mellsell.payment.CreditCardValidator;
import com.mellsell.payment.dto.CreditCardDto;
import com.mellsell.payment.service.PaymentService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Override
    public String processPayment(BigDecimal amount, String method, CreditCardDto creditCard) {
        if (amount == null || amount.signum() <= 0) {
            return "FREE-" + UUID.randomUUID();
        }
        String m = method == null ? "" : method.trim().toUpperCase(Locale.ROOT);
        return switch (m) {
            case "FAKE" -> "FAKE-" + UUID.randomUUID();
            case "CREDIT_CARD" -> processCreditCard(amount, creditCard);
            default -> throw new IllegalArgumentException("Forma de pagamento não suportada");
        };
    }

    private String processCreditCard(BigDecimal amount, CreditCardDto card) {
        CreditCardValidator.validate(card);
        String last4 = CreditCardValidator.lastFour(card.getNumber());
        String brand = CreditCardValidator.brandHint(card.getNumber());
        // Simulação: não persiste PAN/CVV; em produção trocar por Stripe/Mercado Pago token.
        int installments = clampInstallments(card.getInstallments());
        return "CARD-" + brand.toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "")
                + "-" + last4 + "-"
                + installments + "X-"
                + UUID.randomUUID();
    }

    private static int clampInstallments(Integer installments) {
        if (installments == null) {
            return 1;
        }
        return Math.max(1, Math.min(6, installments));
    }
}