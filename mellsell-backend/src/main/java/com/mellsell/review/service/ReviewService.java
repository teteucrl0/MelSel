package com.mellsell.review.service;

import com.mellsell.auth.entity.User;
import com.mellsell.review.dto.CreateReviewRequest;
import com.mellsell.review.dto.ReviewResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponseDTO addReview(User user, CreateReviewRequest req);
    Page<ReviewResponseDTO> listByProduct(Long productId, Pageable pageable);

    // Admin actions
    Page<ReviewResponseDTO> listPending(Pageable pageable);
    ReviewResponseDTO approveReview(Long reviewId);
    ReviewResponseDTO rejectReview(Long reviewId);
}
