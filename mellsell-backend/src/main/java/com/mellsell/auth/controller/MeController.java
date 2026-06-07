package com.mellsell.auth.controller;

import com.mellsell.auth.dto.*;
import com.mellsell.auth.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final UserProfileService userProfileService;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/profile")
    public UserProfileResponseDTO getProfile() {
        return userProfileService.getProfile(currentEmail());
    }

    @PutMapping("/profile")
    public ProfileUpdateResponseDTO updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userProfileService.updateProfile(currentEmail(), request);
    }

    @PostMapping("/profile/avatar")
    public ProfileUpdateResponseDTO uploadAvatar(@RequestParam("file") MultipartFile file) {
        return userProfileService.updateAvatar(currentEmail(), file);
    }

    @DeleteMapping("/profile/avatar")
    public ProfileUpdateResponseDTO removeAvatar() {
        return userProfileService.removeAvatar(currentEmail());
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(currentEmail(), request);
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso."));
    }
}