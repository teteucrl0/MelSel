package com.mellsell.catalog.service;

import com.mellsell.catalog.dto.CreateProductDTO;
import com.mellsell.catalog.dto.ProductResponseDTO;
import com.mellsell.catalog.dto.UpdateProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {
    ProductResponseDTO createProduct(CreateProductDTO dto);
    ProductResponseDTO getById(Long id);
    Page<ProductResponseDTO> list(String q, Long supplierId, Pageable pageable);
    Page<ProductResponseDTO> listMyProducts(Pageable pageable);
    Page<ProductResponseDTO> listAll(String q, Long supplierId, Pageable pageable);
    ProductResponseDTO update(Long id, UpdateProductDTO dto);
    void delete(Long id);
}
