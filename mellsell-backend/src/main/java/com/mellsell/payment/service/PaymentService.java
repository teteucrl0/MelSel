package com.mellsell.payment.service;

import com.mellsell.payment.dto.CreditCardDto;

import java.math.BigDecimal;

public interface PaymentService {
    /**
     * Process a payment. Methods: FAKE (simulado), CREDIT_CARD (validação + cobrança simulada).
     * @return transaction id or null when declined
     */
    String processPayment(BigDecimal amount, String method, CreditCardDto creditCard);
}
