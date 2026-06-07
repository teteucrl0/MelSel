package com.mellsell.catalog.service.impl;

import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.catalog.dto.AdminSupplierResponseDTO;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.mapper.SupplierMapper;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.AdminSupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminSupplierServiceImpl implements AdminSupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AdminSupplierResponseDTO> listAll() {
        return supplierRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(supplierMapper::toAdminDto)
                .toList();
    }

    @Override
    public AdminSupplierResponseDTO approve(Long id) {
        return setActive(id, true);
    }

    @Override
    public AdminSupplierResponseDTO reject(Long id) {
        return setActive(id, false);
    }

    private AdminSupplierResponseDTO setActive(Long id, boolean active) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        supplier.setActive(active);
        return supplierMapper.toAdminDto(supplierRepository.save(supplier));
    }
}