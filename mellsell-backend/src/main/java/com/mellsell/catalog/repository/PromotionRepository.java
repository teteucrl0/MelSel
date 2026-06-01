package com.mellsell.catalog.repository;

import com.mellsell.catalog.entity.Promotion;
import com.mellsell.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByProductAndActiveTrue(Product product);
    List<Promotion> findByProduct(Product product);
}
