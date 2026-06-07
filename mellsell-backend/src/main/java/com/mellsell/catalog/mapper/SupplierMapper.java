package com.mellsell.catalog.mapper;

import com.mellsell.catalog.dto.AdminSupplierResponseDTO;
import com.mellsell.catalog.dto.SupplierMeResponseDTO;
import com.mellsell.catalog.entity.Supplier;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public SupplierMeResponseDTO toMeDto(Supplier supplier) {
        boolean active = Boolean.TRUE.equals(supplier.getActive());
        return SupplierMeResponseDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .email(supplier.getEmail())
                .active(active)
                .pendingApproval(!active)
                .build();
    }

    public AdminSupplierResponseDTO toAdminDto(Supplier supplier) {
        String ownerEmail = supplier.getOwner() != null ? supplier.getOwner().getEmail() : null;
        return AdminSupplierResponseDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .email(supplier.getEmail())
                .city(supplier.getCity())
                .state(supplier.getState())
                .descriptionSnippet(snippet(supplier.getDescription()))
                .active(supplier.getActive())
                .createdAt(supplier.getCreatedAt())
                .ownerEmail(ownerEmail)
                .build();
    }

    private static String snippet(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        String trimmed = description.trim();
        if (trimmed.length() <= 120) {
            return trimmed;
        }
        return trimmed.substring(0, 117) + "...";
    }
}