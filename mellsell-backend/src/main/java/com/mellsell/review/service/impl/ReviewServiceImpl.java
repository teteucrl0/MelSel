package com.mellsell.review.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.review.dto.CreateReviewRequest;
import com.mellsell.review.dto.ReviewResponseDTO;
import com.mellsell.review.entity.Review;
import com.mellsell.review.repository.ReviewRepository;
import com.mellsell.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final com.mellsell.order.repository.OrderRepository orderRepository;

    @Override
    public ReviewResponseDTO addReview(User user, CreateReviewRequest req) {
        Product product = productRepository.findById(req.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        if (!Boolean.TRUE.equals(product.getActive()) || product.getSupplier() == null || !Boolean.TRUE.equals(product.getSupplier().getActive())) {
            throw new IllegalStateException("Produto indisponível para avaliação");
        }

        // Verifica se o usuário comprou este produto em pelo menos um pedido CONFIRMED
        boolean purchased = orderRepository.findByUserId(user.getId()).stream()
                .filter(o -> o.getStatus() == com.mellsell.order.entity.OrderStatus.CONFIRMED)
                .anyMatch(o -> o.getItems().stream().anyMatch(oi -> oi.getProductId().equals(product.getId())));
        if (!purchased) {
            throw new IllegalStateException("Apenas usuários que compraram este produto podem avaliá-lo");
        }

        Review r = Review.builder()
                .product(product)
                .user(user)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        r = reviewRepository.save(r);

        return ReviewResponseDTO.builder()
                .id(r.getId())
                .productId(product.getId())
                .userId(user.getId())
                .userName(user.getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponseDTO> listByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndStatus(productId, com.mellsell.review.entity.ReviewStatus.APPROVED, pageable)
                .map(r -> ReviewResponseDTO.builder()
                        .id(r.getId())
                        .productId(r.getProduct().getId())
                        .userId(r.getUser().getId())
                        .userName(r.getUser().getName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponseDTO> listPending(Pageable pageable) {
        return reviewRepository.findByStatus(com.mellsell.review.entity.ReviewStatus.PENDING, pageable)
                .map(r -> ReviewResponseDTO.builder()
                        .id(r.getId())
                        .productId(r.getProduct().getId())
                        .userId(r.getUser().getId())
                        .userName(r.getUser().getName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build());
    }

    @Override
    public ReviewResponseDTO approveReview(Long reviewId) {
        Review r = reviewRepository.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        r.setStatus(com.mellsell.review.entity.ReviewStatus.APPROVED);
        r = reviewRepository.save(r);
        return ReviewResponseDTO.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }

    @Override
    public ReviewResponseDTO rejectReview(Long reviewId) {
        Review r = reviewRepository.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        r.setStatus(com.mellsell.review.entity.ReviewStatus.REJECTED);
        r = reviewRepository.save(r);
        return ReviewResponseDTO.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
