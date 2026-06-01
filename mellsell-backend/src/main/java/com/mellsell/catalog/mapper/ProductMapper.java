package com.mellsell.catalog.mapper;

import com.mellsell.catalog.dto.CreateProductDTO;
import com.mellsell.catalog.dto.ProductResponseDTO;
import com.mellsell.catalog.dto.UpdateProductDTO;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.entity.Supplier;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(CreateProductDTO dto, Supplier supplier) {
        return Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .lowStockThreshold(dto.getLowStockThreshold())
                .active(true)
                .supplier(supplier)
                .build();
    }

    public void updateEntity(Product product, UpdateProductDTO dto) {
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStock(dto.getStock());
        product.setLowStockThreshold(dto.getLowStockThreshold());
        product.setActive(dto.getActive());
    }

    public ProductResponseDTO toDto(Product p) {
        if (p == null) return null;
        return ProductResponseDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stock(p.getStock())
                .lowStockThreshold(p.getLowStockThreshold())
                .active(p.getActive())
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
