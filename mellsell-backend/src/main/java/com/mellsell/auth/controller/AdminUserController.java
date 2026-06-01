package com.mellsell.auth.controller;

import com.mellsell.auth.dto.ActiveUpdateDTO;
import com.mellsell.auth.dto.AdminUserResponseDTO;
import com.mellsell.auth.dto.RoleUpdateDTO;
import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.service.PdfService;
import com.mellsell.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final PdfService pdfService;

    @GetMapping
    public ResponseEntity<Page<AdminUserResponseDTO>> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AdminUserResponseDTO> result = userService.listUsers(pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponseDTO> getById(@PathVariable Long id) {
        AdminUserResponseDTO dto = userService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<Void> unlock(@PathVariable Long id) {
        userService.unlockUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/roles")
    public ResponseEntity<AdminUserResponseDTO> updateRoles(@PathVariable Long id,
                                                            @Valid @RequestBody RoleUpdateDTO dto,
                                                            Authentication authentication) {
        Long actingUserId = userService.findByEmail(authentication.getName()).map(User::getId).orElse(null);
        Set<Role> roles;
        try {
            roles = dto.getRoles().stream().map(String::toUpperCase).map(Role::valueOf).collect(Collectors.toSet());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        AdminUserResponseDTO updated = userService.updateRoles(id, roles, actingUserId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<AdminUserResponseDTO> setActive(@PathVariable Long id,
                                                          @Valid @RequestBody ActiveUpdateDTO dto) {
        AdminUserResponseDTO updated = userService.setActive(id, dto.getActive());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportByRole(@RequestParam(name = "role") String roleStr) {
        Role role;
        try {
            role = Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
        List<AdminUserResponseDTO> users = userService.listUsersByRole(role);
        byte[] pdf;
        try {
            pdf = pdfService.generateUsersPdf(users, "Usuários - " + role.name());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
        String filename = "users_" + role.name().toLowerCase() + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
