package com.mellsell.auth.service.impl;

import com.mellsell.auth.dto.*;
import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.jwt.JwtService;
import com.mellsell.auth.repository.UserRepository;
import com.mellsell.auth.service.UserProfileService;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.ProductImageStorageService;
import com.mellsell.common.util.InputSanitizer;
import com.mellsell.common.util.ValidatorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductImageStorageService imageStorageService;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return toDto(user);
    }

    @Override
    public ProfileUpdateResponseDTO updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        user.setName(InputSanitizer.requireSafeName(request.getName()));

        if (request.getBirthDate() != null) {
            String birthErr = ValidatorUtil.getBirthDateErrorMessage(request.getBirthDate());
            if (birthErr != null) {
                throw new IllegalArgumentException(birthErr);
            }
            user.setBirthDate(request.getBirthDate());
            user.setAge(ValidatorUtil.calculateAge(request.getBirthDate()));
        }

        if (user.getRoles().contains(Role.VENDEDOR) && request.getStoreName() != null) {
            String store = InputSanitizer.safeStoreName(request.getStoreName());
            user.setStoreName(store);
            final String supplierLabel = store == null ? user.getName() : store;
            supplierRepository.findByOwnerId(user.getId()).ifPresent(supplier -> {
                supplier.setName(supplierLabel);
                supplierRepository.save(supplier);
            });
        }

        user = userRepository.save(user);
        return withFreshToken(user);
    }

    @Override
    public ProfileUpdateResponseDTO updateAvatar(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        user.setAvatarUrl(imageStorageService.storeAvatar(file));
        user = userRepository.save(user);
        return withFreshToken(user);
    }

    @Override
    public ProfileUpdateResponseDTO removeAvatar(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        user.setAvatarUrl(null);
        user = userRepository.save(user);
        return withFreshToken(user);
    }

    @Override
    public BecomeVendorResponseDTO becomeVendor(String email, BecomeVendorRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (user.getRoles().contains(Role.VENDEDOR)) {
            throw new IllegalArgumentException("Você já é apicultor na plataforma.");
        }
        if (!user.getRoles().contains(Role.CLIENTE)) {
            throw new IllegalArgumentException("Apenas contas de cliente podem solicitar venda no MelSell.");
        }
        if (supplierRepository.findByOwnerId(user.getId()).isPresent()) {
            throw new IllegalArgumentException("Fornecedor já cadastrado para esta conta.");
        }

        String store = InputSanitizer.requireSafeStoreName(request.getStoreName());
        String description = InputSanitizer.requireSafeSupplierDescription(request.getSupplierDescription());
        String city = InputSanitizer.requireSafeSupplierCity(request.getSupplierCity());
        String state = InputSanitizer.requireSafeSupplierState(request.getSupplierState());

        Set<Role> roles = new HashSet<>(user.getRoles());
        roles.add(Role.VENDEDOR);
        user.setRoles(roles);
        user.setStoreName(store);
        user = userRepository.save(user);

        Supplier supplier = Supplier.builder()
                .name(store)
                .email(user.getEmail())
                .description(description)
                .city(city)
                .state(state)
                .active(false)
                .owner(user)
                .build();
        supplierRepository.save(supplier);

        UserProfileResponseDTO profile = toDto(user);
        UserDetails details = toUserDetails(user);
        String token = jwtService.generateToken(details, user.getName());
        Set<String> roleNames = user.getRoles().stream().map(Enum::name).collect(Collectors.toSet());

        return BecomeVendorResponseDTO.builder()
                .profile(profile)
                .token(token)
                .displayName(user.getName())
                .roles(roleNames)
                .pendingApproval(true)
                .build();
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }
        if (!ValidatorUtil.isPasswordStrong(request.getNewPassword())) {
            throw new IllegalArgumentException(ValidatorUtil.getPasswordErrorMessage());
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da atual");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private ProfileUpdateResponseDTO withFreshToken(User user) {
        UserDetails details = toUserDetails(user);
        String token = jwtService.generateToken(details, user.getName());
        return ProfileUpdateResponseDTO.builder()
                .profile(toDto(user))
                .token(token)
                .displayName(user.getName())
                .build();
    }

    private static UserDetails toUserDetails(User user) {
        Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .collect(Collectors.toSet());
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.getActive(),
                true,
                true,
                !user.getLocked(),
                authorities
        );
    }

    private static UserProfileResponseDTO toDto(User user) {
        Set<String> roles = user.getRoles().stream().map(Enum::name).collect(Collectors.toSet());
        return UserProfileResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .age(user.getAge())
                .birthDate(user.getBirthDate())
                .storeName(user.getStoreName())
                .roles(roles)
                .vendor(roles.contains(Role.VENDEDOR.name()))
                .build();
    }
}