package com.mellsell.payment.service;

import java.math.BigDecimal;

public interface PaymentService {
    /**
     * Process a payment for the given amount and method. Returns a payment transaction id when successful.
     */
    String processPayment(BigDecimal amount, String method);
}
