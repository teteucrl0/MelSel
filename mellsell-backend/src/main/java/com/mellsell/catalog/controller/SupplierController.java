package com.mellsell.catalog.controller;

import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.repository.UserRepository;
import com.mellsell.catalog.dto.SupplierMeResponseDTO;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.mapper.SupplierMapper;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.SupplierProvisioningService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final SupplierProvisioningService supplierProvisioningService;
    private final SupplierMapper supplierMapper;

    @GetMapping("/me")
    @PreAuthorize("hasRole('VENDEDOR')")
    public ResponseEntity<SupplierMeResponseDTO> getMySupplier() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        Supplier s = supplierProvisioningService.getOrCreateForVendor(user);
        return ResponseEntity.ok(supplierMapper.toMeDto(s));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Supplier>> listAll(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "100") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Supplier> suppliers = supplierRepository.findAll(pageable);
        return ResponseEntity.ok(suppliers);
    }
}
