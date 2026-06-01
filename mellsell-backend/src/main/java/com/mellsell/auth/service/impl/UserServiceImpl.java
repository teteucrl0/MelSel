package com.mellsell.auth.service.impl;

import com.mellsell.auth.dto.AdminUserResponseDTO;
import com.mellsell.auth.dto.RegisterRequest;
import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.mapper.UserMapper;
import com.mellsell.auth.repository.UserRepository;
import com.mellsell.auth.service.UserService;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.common.util.ValidatorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final SupplierRepository supplierRepository;

    @Override
    public User registerClient(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        
        String ageError = ValidatorUtil.getAgeErrorMessage(req.getAge());
        if (ageError != null) {
            throw new IllegalArgumentException(ageError);
        }
        
        if (!ValidatorUtil.isPasswordStrong(req.getPassword())) {
            throw new IllegalArgumentException(ValidatorUtil.getPasswordErrorMessage());
        }
        
        String firstName = extractFirstName(req.getName());
        
        User u = User.builder()
                .name(req.getName())
                .username(firstName)
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .age(req.getAge())
                .active(true)
                .locked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(Role.CLIENTE))
                .build();
        return userRepository.save(u);
    }

    @Override
    public User registerVendor(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        
        String ageError = ValidatorUtil.getAgeErrorMessage(req.getAge());
        if (ageError != null) {
            throw new IllegalArgumentException(ageError);
        }
        
        if (!ValidatorUtil.isPasswordStrong(req.getPassword())) {
            throw new IllegalArgumentException(ValidatorUtil.getPasswordErrorMessage());
        }
        
        String firstName = extractFirstName(req.getName());
        
        User u = User.builder()
                .name(req.getName())
                .username(firstName)
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .age(req.getAge())
                .storeName(req.getStoreName())
                .active(true)
                .locked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(Role.VENDEDOR))
                .build();
        u = userRepository.save(u);

        Supplier s = Supplier.builder()
                .name(u.getName())
                .email(u.getEmail())
                .active(true)
                .owner(u)
                .build();
        supplierRepository.save(s);

        return u;
    }

    @Override
    public void increaseFailedAttempts(String email) {
        Optional<User> ou = userRepository.findByEmail(email);
        ou.ifPresent(u -> {
            if (u.getLocked()) {
                throw new IllegalArgumentException("Conta bloqueada. Tente novamente mais tarde.");
            }
            int attempts = (u.getFailedLoginAttempts() == null ? 0 : u.getFailedLoginAttempts()) + 1;
            u.setFailedLoginAttempts(attempts);
            if (attempts >= 3) {
                u.setLocked(true);
            }
            u.setLastLogin(LocalDateTime.now());
            userRepository.save(u);
        });
    }

    @Override
    public void resetFailedAttempts(String email) {
        Optional<User> ou = userRepository.findByEmail(email);
        ou.ifPresent(u -> {
            u.setFailedLoginAttempts(0);
            u.setLastLogin(LocalDateTime.now());
            userRepository.save(u);
        });
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public void unlockUser(Long userId) {
        Optional<User> ou = userRepository.findById(userId);
        ou.ifPresent(u -> {
            u.setLocked(false);
            u.setFailedLoginAttempts(0);
            userRepository.save(u);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponseDTO> listUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return page.map(userMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponseDTO getById(Long id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return userMapper.toDto(u);
    }

    @Override
    public AdminUserResponseDTO updateRoles(Long id, Set<Role> roles, Long actingUserId) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        if (actingUserId != null && actingUserId.equals(id) && (roles == null || !roles.contains(Role.ADMIN))) {
            throw new IllegalArgumentException("Não é permitido remover o papel ADMIN de si mesmo");
        }
        u.setRoles(roles);
        u = userRepository.save(u);
        return userMapper.toDto(u);
    }

    @Override
    public AdminUserResponseDTO setActive(Long id, Boolean active) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        u.setActive(active);
        u = userRepository.save(u);
        return userMapper.toDto(u);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponseDTO> listUsersByRole(Role role) {
        List<User> users = userRepository.findByRole(role);
        return users.stream().map(userMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
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

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "user" + System.nanoTime() % 10000;
        }
        String firstName = fullName.split("\\s+")[0].toLowerCase();
        
        // Garantir que é único adicionando número se necessário
        String baseUsername = firstName;
        int counter = 1;
        while (userRepository.findByUsername(firstName).isPresent()) {
            firstName = baseUsername + counter;
            counter++;
        }
        return firstName;
    }
}
