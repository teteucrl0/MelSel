package com.mellsell.auth.service.impl;

import com.mellsell.auth.dto.AdminUpdateUserDTO;
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
import com.mellsell.common.util.InputSanitizer;
import com.mellsell.common.util.ValidatorUtil;
import com.mellsell.realtime.ApiaryOnboardingService;
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
    private final ApiaryOnboardingService apiaryOnboardingService;

    @Override
    public User registerClient(RegisterRequest req) {
        sanitizeRegisterRequest(req);
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        
        String birthDateError = ValidatorUtil.getBirthDateErrorMessage(req.getBirthDate());
        if (birthDateError != null) {
            throw new IllegalArgumentException(birthDateError);
        }
        
        if (!ValidatorUtil.isPasswordStrong(req.getPassword())) {
            throw new IllegalArgumentException(ValidatorUtil.getPasswordErrorMessage());
        }
        
        int age = ValidatorUtil.calculateAge(req.getBirthDate());
        String firstName = extractFirstName(req.getName());
        
        User u = User.builder()
                .name(req.getName())
                .username(firstName)
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .age(age)
                .birthDate(req.getBirthDate())
                .active(true)
                .locked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(Role.CLIENTE))
                .build();
        return userRepository.save(u);
    }

    @Override
    public User registerVendor(RegisterRequest req) {
        sanitizeRegisterRequest(req);
        String store = req.getStoreName();
        if (store == null || store.isBlank()) {
            throw new IllegalArgumentException("Informe o nome da sua loja ou apiário");
        }
        if (store.trim().length() < 3) {
            throw new IllegalArgumentException("Nome da loja deve ter pelo menos 3 caracteres");
        }
        String supplierDescription = InputSanitizer.requireSafeSupplierDescription(req.getSupplierDescription());
        String supplierCity = InputSanitizer.requireSafeSupplierCity(req.getSupplierCity());
        String supplierState = InputSanitizer.requireSafeSupplierState(req.getSupplierState());
        req.setSupplierDescription(supplierDescription);
        req.setSupplierCity(supplierCity);
        req.setSupplierState(supplierState);
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        
        String birthDateError = ValidatorUtil.getBirthDateErrorMessage(req.getBirthDate());
        if (birthDateError != null) {
            throw new IllegalArgumentException(birthDateError);
        }
        
        if (!ValidatorUtil.isPasswordStrong(req.getPassword())) {
            throw new IllegalArgumentException(ValidatorUtil.getPasswordErrorMessage());
        }
        
        int age = ValidatorUtil.calculateAge(req.getBirthDate());
        String firstName = extractFirstName(req.getName());
        
        User u = User.builder()
                .name(req.getName())
                .username(firstName)
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .age(age)
                .birthDate(req.getBirthDate())
                .storeName(req.getStoreName())
                .active(true)
                .locked(false)
                .failedLoginAttempts(0)
                .roles(Set.of(Role.VENDEDOR))
                .build();
        u = userRepository.save(u);

        String supplierLabel = req.getStoreName() != null && !req.getStoreName().isBlank()
                ? req.getStoreName().trim()
                : u.getName();
        Supplier s = Supplier.builder()
                .name(supplierLabel)
                .email(u.getEmail())
                .active(false)
                .description(supplierDescription)
                .city(supplierCity)
                .state(supplierState)
                .owner(u)
                .build();
        Supplier savedSupplier = supplierRepository.save(s);
        String storeLabel = req.getStoreName() != null && !req.getStoreName().isBlank()
                ? req.getStoreName()
                : savedSupplier.getName();
        apiaryOnboardingService.broadcastVendorOnboarding(u.getName(), storeLabel);

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
        return listUsers(null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponseDTO> listUsers(String q, Role role, Pageable pageable) {
        String query = q != null && !q.isBlank() ? q.trim() : null;
        Page<User> page = userRepository.findFiltered(query, role, pageable);
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
        if (Boolean.FALSE.equals(active) && u.getRoles().contains(Role.ADMIN)) {
            long activeAdmins = userRepository.findByRole(Role.ADMIN).stream()
                    .filter(user -> Boolean.TRUE.equals(user.getActive()))
                    .count();
            if (activeAdmins <= 1) {
                throw new IllegalArgumentException("Não é possível desativar o único administrador ativo");
            }
        }
        u.setActive(active);
        u = userRepository.save(u);
        return userMapper.toDto(u);
    }

    @Override
    public AdminUserResponseDTO adminUpdateUser(Long id, AdminUpdateUserDTO dto, Long actingUserId) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        u.setName(InputSanitizer.requireSafeName(dto.getName()));
        if (u.getRoles().contains(Role.VENDEDOR)) {
            String store = InputSanitizer.safeStoreName(dto.getStoreName());
            u.setStoreName(store);
            final String supplierLabel = store == null ? u.getName() : store;
            supplierRepository.findByOwnerId(u.getId()).ifPresent(supplier -> {
                supplier.setName(supplierLabel);
                supplierRepository.save(supplier);
            });
        }
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

    private void sanitizeRegisterRequest(RegisterRequest req) {
        req.setName(InputSanitizer.requireSafeName(req.getName()));
        req.setEmail(InputSanitizer.normalizeEmail(req.getEmail()));
        req.setStoreName(InputSanitizer.safeStoreName(req.getStoreName()));
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "user" + System.nanoTime() % 10000;
        }
        String firstName = fullName.split("\\s+")[0].toLowerCase();
        
        String baseUsername = firstName;
        int counter = 1;
        while (userRepository.findByUsername(firstName).isPresent()) {
            firstName = baseUsername + counter;
            counter++;
        }
        return firstName;
    }
}
