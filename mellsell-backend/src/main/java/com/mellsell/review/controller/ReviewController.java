package com.mellsell.review.controller;

import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.service.UserService;
import com.mellsell.review.dto.CreateReviewRequest;
import com.mellsell.review.dto.ReviewResponseDTO;
import com.mellsell.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    @PreAuthorize("hasRole('CLIENTE')")
    @PostMapping
    public ReviewResponseDTO addReview(@Valid @RequestBody CreateReviewRequest req) {
        return reviewService.addReview(currentUser(), req);
    }

    @GetMapping("/product/{productId}")
    public Page<ReviewResponseDTO> listByProduct(@PathVariable Long productId,
                                                 @RequestParam(name = "page", defaultValue = "0") int page,
                                                 @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.listByProduct(productId, pageable);
    }
}
