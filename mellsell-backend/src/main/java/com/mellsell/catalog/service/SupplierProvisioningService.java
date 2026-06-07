package com.mellsell.catalog.service;

import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierProvisioningService {

    private final SupplierRepository supplierRepository;

    @Transactional
    public Supplier getOrCreateForVendor(User user) {
        return supplierRepository.findByOwnerId(user.getId())
                .orElseGet(() -> createSupplierForVendor(user));
    }

    private Supplier createSupplierForVendor(User user) {
        boolean isVendor = user.getRoles() != null && user.getRoles().contains(Role.VENDEDOR);
        if (!isVendor) {
            throw new ResourceNotFoundException("Fornecedor não encontrado para o usuário");
        }

        String label = user.getStoreName() != null && !user.getStoreName().isBlank()
                ? user.getStoreName().trim()
                : user.getName();

        Supplier supplier = Supplier.builder()
                .name(label)
                .email(user.getEmail())
                .owner(user)
                .active(false)
                .build();

        return supplierRepository.save(supplier);
    }
}