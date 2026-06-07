package com.mellsell.auth.controller;

import com.mellsell.auth.dto.BecomeVendorRequest;
import com.mellsell.auth.dto.BecomeVendorResponseDTO;
import com.mellsell.auth.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserProfileService userProfileService;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/become-vendor")
    public ResponseEntity<BecomeVendorResponseDTO> becomeVendor(@Valid @RequestBody BecomeVendorRequest request) {
        return ResponseEntity.ok(userProfileService.becomeVendor(currentEmail(), request));
    }
}