package com.mellsell.catalog.controller;

import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.service.UserService;
import com.mellsell.catalog.dto.CouponDTO;
import com.mellsell.catalog.dto.PromotionDTO;
import com.mellsell.catalog.entity.Coupon;
import com.mellsell.catalog.entity.Promotion;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.CouponRepository;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.catalog.repository.PromotionRepository;
import com.mellsell.catalog.repository.SupplierRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
public class VendorController {

    private final CouponRepository couponRepository;
    private final PromotionRepository promotionRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private Supplier currentSupplier() {
        User user = currentUser();
        return supplierRepository.findByOwnerId(user.getId()).orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @PostMapping("/coupons")
    public CouponDTO createCoupon(@Valid @RequestBody CouponDTO dto) {
        Coupon coupon = Coupon.builder()
                .code(dto.getCode().toUpperCase())
                .supplier(currentSupplier())
                .discountPercentage(dto.getDiscountPercentage())
                .maxUses(dto.getMaxUses())
                .validFrom(dto.getValidFrom())
                .validUntil(dto.getValidUntil())
                .active(true)
                .build();
        coupon = couponRepository.save(coupon);
        return mapCouponToDTO(coupon);
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @GetMapping("/coupons")
    public List<CouponDTO> listCoupons() {
        return couponRepository.findBySupplier(currentSupplier()).stream()
                .map(this::mapCouponToDTO)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @DeleteMapping("/coupons/{id}")
    public void deleteCoupon(@PathVariable Long id) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cupom não encontrado"));
        couponRepository.delete(coupon);
    }

    @PostMapping("/coupons/validate")
    public CouponDTO validateCoupon(@RequestParam String code) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cupom não encontrado"));
        if (!coupon.getActive() || coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new IllegalArgumentException("Cupom inválido ou expirado");
        }
        return mapCouponToDTO(coupon);
    }

    // ─── Promoções ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('VENDEDOR')")
    @PostMapping("/promotions")
    public PromotionDTO createPromotion(@Valid @RequestBody PromotionDTO dto) {
        var product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        Promotion promo = Promotion.builder()
                .name(dto.getName())
                .product(product)
                .discountPercentage(dto.getDiscountPercentage())
                .discountFixed(dto.getDiscountFixed())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .active(true)
                .build();
        return mapPromotionToDTO(promotionRepository.save(promo));
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @GetMapping("/promotions")
    public List<PromotionDTO> listPromotions() {
        Supplier supplier = currentSupplier();
        return promotionRepository.findAll().stream()
                .filter(p -> p.getProduct().getSupplier() != null &&
                             p.getProduct().getSupplier().getId().equals(supplier.getId()))
                .map(this::mapPromotionToDTO)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @PutMapping("/promotions/{id}")
    public PromotionDTO togglePromotion(@PathVariable Long id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promoção não encontrada"));
        promo.setActive(!promo.getActive());
        return mapPromotionToDTO(promotionRepository.save(promo));
    }

    @PreAuthorize("hasRole('VENDEDOR')")
    @DeleteMapping("/promotions/{id}")
    public void deletePromotion(@PathVariable Long id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promoção não encontrada"));
        Supplier supplier = currentSupplier();
        if (!promo.getProduct().getSupplier().getId().equals(supplier.getId())) {
            throw new ResourceNotFoundException("Promoção não encontrada");
        }
        promotionRepository.delete(promo);
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private CouponDTO mapCouponToDTO(Coupon coupon) {
        return CouponDTO.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercentage(coupon.getDiscountPercentage())
                .maxUses(coupon.getMaxUses())
                .usedCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .active(coupon.getActive())
                .build();
    }

    private PromotionDTO mapPromotionToDTO(Promotion promo) {
        return PromotionDTO.builder()
                .id(promo.getId())
                .name(promo.getName())
                .productId(promo.getProduct().getId())
                .productName(promo.getProduct().getName())
                .discountPercentage(promo.getDiscountPercentage())
                .discountFixed(promo.getDiscountFixed())
                .startDate(promo.getStartDate())
                .endDate(promo.getEndDate())
                .active(promo.getActive())
                .build();
    }
}
