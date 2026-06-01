package com.mellsell.catalog.controller;

import com.mellsell.catalog.dto.CreateProductDTO;
import com.mellsell.catalog.dto.ProductResponseDTO;
import com.mellsell.catalog.dto.UpdateProductDTO;
import com.mellsell.catalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/products")
@Validated
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    @PostMapping
    public ResponseEntity<ProductResponseDTO> create(@Valid @RequestBody CreateProductDTO dto) {
        ProductResponseDTO created = productService.createProduct(dto);
        return ResponseEntity.created(URI.create("/api/products/" + created.getId())).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> list(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "supplierId", required = false) Long supplierId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductResponseDTO> result = productService.list(q, supplierId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getById(@PathVariable Long id) {
        ProductResponseDTO dto = productService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> update(@PathVariable Long id, @Valid @RequestBody UpdateProductDTO dto) {
        ProductResponseDTO updated = productService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
