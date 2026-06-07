package com.mellsell.auth.service;

import com.mellsell.auth.dto.*;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {
    UserProfileResponseDTO getProfile(String email);

    ProfileUpdateResponseDTO updateProfile(String email, UpdateProfileRequest request);

    ProfileUpdateResponseDTO updateAvatar(String email, MultipartFile file);

    ProfileUpdateResponseDTO removeAvatar(String email);

    void changePassword(String email, ChangePasswordRequest request);

    BecomeVendorResponseDTO becomeVendor(String email, BecomeVendorRequest request);
}