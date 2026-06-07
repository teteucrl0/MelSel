package com.mellsell.payment;

import com.mellsell.payment.dto.CreditCardDto;

import java.time.YearMonth;
import java.util.Set;

public final class CreditCardValidator {

    /** Números de teste que simulam recusa (padrão gateways). */
    private static final Set<String> DECLINE_NUMBERS = Set.of(
            "4000000000000002",
            "4000000000000069"
    );

    private CreditCardValidator() {}

    public static void validate(CreditCardDto card) {
        if (card == null) {
            throw new IllegalArgumentException("Dados do cartão são obrigatórios");
        }
        String digits = card.getNumber().replaceAll("\\D", "");
        if (!luhnValid(digits)) {
            throw new IllegalArgumentException("Número do cartão inválido");
        }
        if (DECLINE_NUMBERS.contains(digits)) {
            throw new IllegalStateException("Cartão recusado pelo emissor");
        }
        int month = Integer.parseInt(card.getExpMonth());
        int year = normalizeYear(card.getExpYear());
        YearMonth expiry = YearMonth.of(year, month);
        if (expiry.isBefore(YearMonth.now())) {
            throw new IllegalArgumentException("Cartão expirado");
        }
        String cvv = card.getCvv().replaceAll("\\D", "");
        if (cvv.length() < 3 || cvv.length() > 4) {
            throw new IllegalArgumentException("CVV inválido");
        }
        if ("000".equals(cvv) || "0000".equals(cvv)) {
            throw new IllegalStateException("Cartão recusado pelo emissor");
        }
        int installments = card.getInstallments() == null ? 1 : card.getInstallments();
        if (installments < 1 || installments > 6) {
            throw new IllegalArgumentException("Parcelamento deve ser de 1 a 6 vezes");
        }
    }

    public static String lastFour(String number) {
        String digits = number.replaceAll("\\D", "");
        return digits.length() >= 4 ? digits.substring(digits.length() - 4) : digits;
    }

    public static String brandHint(String number) {
        String d = number.replaceAll("\\D", "");
        if (d.startsWith("4")) return "Visa";
        if (d.startsWith("5")) return "Mastercard";
        if (d.startsWith("34") || d.startsWith("37")) return "Amex";
        if (d.startsWith("6")) return "Elo/Discover";
        return "Cartão";
    }

    private static int normalizeYear(String expYear) {
        int y = Integer.parseInt(expYear.replaceAll("\\D", ""));
        return y < 100 ? 2000 + y : y;
    }

    static boolean luhnValid(String digits) {
        int sum = 0;
        boolean alternate = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = digits.charAt(i) - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }
}