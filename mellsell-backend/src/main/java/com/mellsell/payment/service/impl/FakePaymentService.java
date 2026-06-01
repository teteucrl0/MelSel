package com.mellsell.payment.service.impl;

import com.mellsell.payment.service.PaymentService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class FakePaymentService implements PaymentService {

    @Override
    public String processPayment(BigDecimal amount, String method) {
        // Simple simulated payment: accept all payments and return a fake transaction id
        return "FAKE-" + UUID.randomUUID();
    }
}
