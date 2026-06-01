package com.mellsell.review.repository;

import com.mellsell.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByProductId(Long productId, Pageable pageable);
    Page<Review> findByProductIdAndStatus(Long productId, com.mellsell.review.entity.ReviewStatus status, Pageable pageable);
    Page<Review> findByStatus(com.mellsell.review.entity.ReviewStatus status, Pageable pageable);
}
