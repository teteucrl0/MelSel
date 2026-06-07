package com.mellsell.catalog.service.impl;

import com.mellsell.catalog.dto.CreateProductDTO;
import com.mellsell.catalog.dto.ProductResponseDTO;
import com.mellsell.catalog.dto.UpdateProductDTO;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.mapper.ProductMapper;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.ProductService;
import com.mellsell.common.util.InputSanitizer;
import com.mellsell.realtime.RealtimeBroadcastService;
import com.mellsell.auth.repository.UserRepository;
import com.mellsell.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ProductMapper mapper;
    private final UserRepository userRepository;
    private final RealtimeBroadcastService realtimeBroadcastService;

    @Override
    public ProductResponseDTO createProduct(CreateProductDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        if (!Boolean.TRUE.equals(supplier.getActive())) {
            throw new IllegalStateException("Fornecedor está inativo e não pode cadastrar produtos");
        }
        // verifica se o vendedor atual tem permissão sobre esse fornecedor
        checkVendorOwnership(supplier);
        sanitizeProductDto(dto);

        Product product = mapper.toEntity(dto, supplier);
        product = productRepository.save(product);
        realtimeBroadcastService.broadcastInventory(product);
        return mapper.toDto(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDTO getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        if (!Boolean.TRUE.equals(p.getActive()) || p.getSupplier() == null || !Boolean.TRUE.equals(p.getSupplier().getActive())) {
            throw new ResourceNotFoundException("Produto não encontrado");
        }
        return mapper.toDto(p);
    }

    /** Catálogo público: q busca nome, descrição e nome do fornecedor (supplierName no DTO). */
    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> list(String q, Long supplierId, Pageable pageable) {
        q = normalizeQuery(q);
        Page<Product> page;
        if (q != null && supplierId != null) {
            page = productRepository.searchActiveBySupplierAndQuery(supplierId, q, pageable);
        } else if (q != null) {
            page = productRepository.searchActiveByNameOrDescription(q, pageable);
        } else if (supplierId != null) {
            page = productRepository.findBySupplierIdAndActive(supplierId, pageable);
        } else {
            page = productRepository.findByActiveTrueAndSupplierActiveTrue(pageable);
        }
        return page.map(mapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> listMyProducts(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Usuário não autenticado");
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        Page<Product> page = productRepository.findBySupplierOwnerIdOrderByCreatedAtDesc(user.getId(), pageable);
        return page.map(mapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> listAll(String q, Long supplierId, Pageable pageable) {
        q = normalizeQuery(q);
        Page<Product> page;
        if (q != null && supplierId != null) {
            page = productRepository.searchBySupplierAndQuery(supplierId, q, pageable);
        } else if (q != null) {
            page = productRepository.searchByNameOrDescription(q, pageable);
        } else if (supplierId != null) {
            page = productRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId, pageable);
        } else {
            page = productRepository.findAllOrderByCreatedAtDesc(pageable);
        }
        return page.map(mapper::toDto);
    }

    @Override
    public ProductResponseDTO update(Long id, UpdateProductDTO dto) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        // verifica permissão do vendedor sobre o fornecedor do produto
        checkVendorOwnership(p.getSupplier());
        sanitizeProductDto(dto);
        int stockBefore = p.getStock() != null ? p.getStock() : 0;
        mapper.updateEntity(p, dto);
        p = productRepository.save(p);
        realtimeBroadcastService.publishStockChange(p, stockBefore);
        return mapper.toDto(p);
    }

    @Override
    public void delete(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        // verifica permissão do vendedor sobre o fornecedor do produto
        checkVendorOwnership(p.getSupplier());
        // Soft delete: marca como inativo
        int stockBefore = p.getStock() != null ? p.getStock() : 0;
        p.setActive(false);
        p.setStock(0);
        productRepository.save(p);
        realtimeBroadcastService.publishStockChange(p, stockBefore);
    }

    private static String normalizeQuery(String q) {
        if (q == null) {
            return null;
        }
        String trimmed = q.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static void sanitizeProductDto(CreateProductDTO dto) {
        dto.setName(InputSanitizer.requireSafeProductName(dto.getName()));
        dto.setDescription(InputSanitizer.safeProductDescription(dto.getDescription()));
    }

    private static void sanitizeProductDto(UpdateProductDTO dto) {
        dto.setName(InputSanitizer.requireSafeProductName(dto.getName()));
        dto.setDescription(InputSanitizer.safeProductDescription(dto.getDescription()));
    }

    private void checkVendorOwnership(Supplier supplier) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return;
        boolean isVendor = auth.getAuthorities().stream().anyMatch(a -> "ROLE_VENDEDOR".equals(a.getAuthority()));
        if (!isVendor) return; // admins can proceed
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        if (supplier.getOwner() == null || !supplier.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Você não tem permissão para gerenciar produtos deste fornecedor");
        }
    }
}
