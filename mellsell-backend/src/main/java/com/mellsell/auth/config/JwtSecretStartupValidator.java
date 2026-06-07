package com.mellsell.auth.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Alerta (ou bloqueia) quando JWT_SECRET usa valor padrão de desenvolvimento.
 */
@Slf4j
@Component
public class JwtSecretStartupValidator implements ApplicationRunner {

    private static final Set<String> KNOWN_WEAK_SECRETS = Set.of(
            "replace_this_with_a_secure_long_secret_key",
            "mellsell-mysql-dev-secret-key-32chars!!",
            "mellsell-dev-secret-key-for-local-only-32chars!!",
            "mellsell-presentation-secret-key-32chars!!"
    );

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${mellsell.security.reject-weak-jwt-secret:false}")
    private boolean rejectWeak;

    @Override
    public void run(ApplicationArguments args) {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            String msg = "JWT secret deve ter pelo menos 32 caracteres. Defina JWT_SECRET no ambiente.";
            if (rejectWeak) {
                throw new IllegalStateException(msg);
            }
            log.error(msg);
            return;
        }
        if (KNOWN_WEAK_SECRETS.contains(jwtSecret)) {
            String msg = "JWT_SECRET usa valor padrão de desenvolvimento. Defina JWT_SECRET forte antes de produção.";
            if (rejectWeak) {
                throw new IllegalStateException(msg);
            }
            log.warn(msg);
        }
    }
}