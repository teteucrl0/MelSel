package com.mellsell.common.util;

public class ValidatorUtil {

    private static final int MIN_AGE = 21;
    private static final int MAX_AGE = 150;

    public static boolean isValidAge(Integer age) {
        return age != null && age >= MIN_AGE && age <= MAX_AGE;
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
