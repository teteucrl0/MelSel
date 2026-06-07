package com.mellsell.catalog.mapper;

import com.mellsell.catalog.dto.CreateProductDTO;
import com.mellsell.catalog.dto.ProductResponseDTO;
import com.mellsell.catalog.dto.UpdateProductDTO;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.auth.entity.User;
import com.mellsell.common.util.ProductImageUrlValidator;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(CreateProductDTO dto, Supplier supplier) {
        return Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(ProductImageUrlValidator.normalize(dto.getImageUrl()))
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
        if (dto.getImageUrl() != null) {
            product.setImageUrl(ProductImageUrlValidator.normalize(dto.getImageUrl()));
        }
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
                .imageUrl(p.getImageUrl())
                .price(p.getPrice())
                .stock(p.getStock())
                .lowStockThreshold(p.getLowStockThreshold())
                .active(p.getActive())
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(supplierDisplayName(p.getSupplier()))
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    /** Nome da loja do apicultor, quando existir; senão o nome do fornecedor. */
    private static String supplierDisplayName(Supplier supplier) {
        if (supplier == null) return null;
        User owner = supplier.getOwner();
        if (owner != null && owner.getStoreName() != null && !owner.getStoreName().isBlank()) {
            return owner.getStoreName().trim();
        }
        return supplier.getName();
    }
}
