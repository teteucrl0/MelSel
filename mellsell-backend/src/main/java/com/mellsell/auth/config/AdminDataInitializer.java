package com.mellsell.auth.config;

import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

@Component
@Slf4j
@RequiredArgsConstructor
@Order(1)
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${mellsell.admin.email:}")
    private String adminEmailProp;

    @Value("${mellsell.admin.password:}")
    private String adminPasswordProp;

    @Override
    public void run(String... args) throws Exception {
        String email = Optional.ofNullable(System.getenv("MELSELL_ADMIN_EMAIL")).filter(s -> !s.isBlank()).orElse(adminEmailProp);
        String password = Optional.ofNullable(System.getenv("MELSELL_ADMIN_PASSWORD")).filter(s -> !s.isBlank()).orElse(adminPasswordProp);

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("Admin credentials not provided. To create an admin set env vars MELSELL_ADMIN_EMAIL and MELSELL_ADMIN_PASSWORD or properties mellsell.admin.email and mellsell.admin.password");
            return;
        }

        if (userRepository.existsByEmail(email)) {
            log.info("Admin user already exists: {}", email);
            return;
        }

        User admin = User.builder()
                .name("Administrator")
                .email(email)
                .password(passwordEncoder.encode(password))
                .age(30)
                .active(true)
                .locked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(Role.ADMIN))
                .build();

        userRepository.save(admin);
        log.info("Admin user created: {}", email);
    }
}
