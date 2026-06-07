package com.mellsell.auth.mapper;

import com.mellsell.auth.dto.AdminUserResponseDTO;
import com.mellsell.auth.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public AdminUserResponseDTO toDto(User u) {
        if (u == null) return null;
        return AdminUserResponseDTO.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .username(u.getUsername())
                .avatarUrl(u.getAvatarUrl())
                .storeName(u.getStoreName())
                .age(u.getAge())
                .birthDate(u.getBirthDate())
                .active(u.getActive())
                .locked(u.getLocked())
                .failedLoginAttempts(u.getFailedLoginAttempts())
                .roles(u.getRoles() == null ? java.util.Set.of() : u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .build();
    }
}
