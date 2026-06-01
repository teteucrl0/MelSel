package com.mellsell.auth.service;

import com.mellsell.auth.dto.AdminUserResponseDTO;
import com.mellsell.auth.dto.RegisterRequest;
import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserService extends UserDetailsService {
    User registerClient(RegisterRequest req);
    User registerVendor(RegisterRequest req);
    void increaseFailedAttempts(String email);
    void resetFailedAttempts(String email);
    Optional<User> findByEmail(String email);
    void unlockUser(Long userId);

    Page<AdminUserResponseDTO> listUsers(Pageable pageable);
    AdminUserResponseDTO getById(Long id);
    AdminUserResponseDTO updateRoles(Long id, Set<Role> roles, Long actingUserId);
    AdminUserResponseDTO setActive(Long id, Boolean active);

    List<AdminUserResponseDTO> listUsersByRole(Role role);
}
