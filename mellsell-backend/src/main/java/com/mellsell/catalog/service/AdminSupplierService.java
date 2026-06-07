package com.mellsell.catalog.service;

import com.mellsell.catalog.dto.AdminSupplierResponseDTO;

import java.util.List;

public interface AdminSupplierService {
    List<AdminSupplierResponseDTO> listAll();

    AdminSupplierResponseDTO approve(Long id);

    AdminSupplierResponseDTO reject(Long id);
}