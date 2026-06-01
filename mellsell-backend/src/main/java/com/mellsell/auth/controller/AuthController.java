package com.mellsell.auth.controller;

import com.mellsell.auth.dto.AuthenticationRequest;
import com.mellsell.auth.dto.AuthenticationResponse;
import com.mellsell.auth.dto.RegisterRequest;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.jwt.JwtService;
import com.mellsell.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody AuthenticationRequest req) {
        try {
            var auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
            UserDetails ud = (UserDetails) auth.getPrincipal();
            String token = jwtService.generateToken(ud);
            userService.resetFailedAttempts(req.getEmail());
            return ResponseEntity.ok(new AuthenticationResponse(token, "Bearer"));
        } catch (BadCredentialsException ex) {
            // increment failed attempts and possibly lock
            userService.increaseFailedAttempts(req.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (AuthenticationException ex) {
            // locked or other
            return ResponseEntity.status(HttpStatus.LOCKED).build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerClient(@Valid @RequestBody RegisterRequest req) {
        User created = userService.registerClient(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created.getEmail());
    }

    @PostMapping("/register/vendor")
    public ResponseEntity<?> registerVendor(@Valid @RequestBody RegisterRequest req) {
        User created = userService.registerVendor(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created.getEmail());
    }
}
