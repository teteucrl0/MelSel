package com.mellsell.catalog.controller;

import com.mellsell.catalog.dto.AdminSupplierResponseDTO;
import com.mellsell.catalog.service.AdminSupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/suppliers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSupplierController {

    private final AdminSupplierService adminSupplierService;

    @GetMapping
    public ResponseEntity<List<AdminSupplierResponseDTO>> list() {
        return ResponseEntity.ok(adminSupplierService.listAll());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<AdminSupplierResponseDTO> approve(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupplierService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<AdminSupplierResponseDTO> reject(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupplierService.reject(id));
    }
}