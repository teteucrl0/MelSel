package com.mellsell.common.util;

import java.time.LocalDate;
import java.time.Period;

public class ValidatorUtil {

    private static final int MIN_AGE = 18;
    private static final int MAX_AGE = 150;

    public static int calculateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return 0;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    public static boolean isValidAge(Integer age) {
        return age != null && age >= MIN_AGE && age <= MAX_AGE;
    }

    public static boolean isAdult(LocalDate birthDate) {
        return calculateAge(birthDate) >= MIN_AGE;
    }

    public static String getAgeErrorMessage(Integer age) {
        if (age == null) {
            return "Idade é obrigatória";
        }
        if (age < MIN_AGE) {
            return "Você deve ter no mínimo " + MIN_AGE + " anos para se registrar";
        }
        if (age > MAX_AGE) {
            return "Idade inválida";
        }
        return null;
    }

    public static String getBirthDateErrorMessage(LocalDate birthDate) {
        if (birthDate == null) {
            return "Data de nascimento é obrigatória";
        }
        int age = calculateAge(birthDate);
        if (age < MIN_AGE) {
            return "Você deve ter no mínimo " + MIN_AGE + " anos para se registrar. Sua idade: " + age + " anos.";
        }
        if (age > MAX_AGE) {
            return "Idade inválida";
        }
        if (birthDate.isAfter(LocalDate.now())) {
            return "Data de nascimento não pode ser no futuro";
        }
        return null;
    }

    public static boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        boolean hasUpperCase = password.matches(".*[A-Z].*");
        boolean hasLowerCase = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecialChar = password.matches(".*[@$!%*?&].*");
        
        return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
    }

    public static String getPasswordErrorMessage() {
        return "Senha deve ter: mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial (@$!%*?&)";
    }
}
