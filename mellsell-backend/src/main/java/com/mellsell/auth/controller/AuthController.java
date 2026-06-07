package com.mellsell.auth.controller;

import com.mellsell.auth.dto.AuthenticationRequest;
import com.mellsell.auth.dto.AuthenticationResponse;
import com.mellsell.auth.dto.RegisterRequest;
import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.jwt.JwtService;
import com.mellsell.auth.service.UserService;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.SupplierProvisioningService;
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
    private final SupplierProvisioningService supplierProvisioningService;
    private final SupplierRepository supplierRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody AuthenticationRequest req) {
        try {
            var auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
            UserDetails ud = (UserDetails) auth.getPrincipal();
            User user = userService.findByEmail(req.getEmail())
                    .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
            String displayName = user.getName();
            String token = jwtService.generateToken(ud, displayName);
            userService.resetFailedAttempts(req.getEmail());
            if (user.getRoles() != null && user.getRoles().contains(Role.VENDEDOR)) {
                supplierProvisioningService.getOrCreateForVendor(user);
            }
            java.util.Set<String> roleNames = user.getRoles() == null
                    ? java.util.Set.of()
                    : user.getRoles().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet());
            return ResponseEntity.ok(AuthenticationResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .displayName(displayName)
                    .email(user.getEmail())
                    .roles(roleNames)
                    .build());
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
    public ResponseEntity<AuthenticationResponse> registerVendor(@Valid @RequestBody RegisterRequest req) {
        User created = userService.registerVendor(req);
        UserDetails ud = userService.loadUserByUsername(created.getEmail());
        String displayName = created.getName();
        String token = jwtService.generateToken(ud, displayName);
        Boolean supplierActive = null;
        Boolean pendingApproval = null;
        Supplier supplier = supplierRepository.findByOwnerId(created.getId()).orElse(null);
        if (supplier != null) {
            supplierActive = Boolean.TRUE.equals(supplier.getActive());
            pendingApproval = !supplierActive;
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthenticationResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .displayName(displayName)
                .email(created.getEmail())
                .roles(java.util.Set.of(Role.VENDEDOR.name()))
                .supplierActive(supplierActive)
                .pendingApproval(pendingApproval)
                .build());
    }
}
