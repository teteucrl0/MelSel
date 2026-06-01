package com.mellsell.catalog.repository;

import com.mellsell.catalog.entity.Coupon;
import com.mellsell.catalog.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    List<Coupon> findBySupplierAndActiveTrue(Supplier supplier);
    List<Coupon> findBySupplier(Supplier supplier);
}
