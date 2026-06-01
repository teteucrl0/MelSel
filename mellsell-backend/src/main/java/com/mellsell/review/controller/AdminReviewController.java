package com.mellsell.review.controller;

import com.mellsell.review.dto.ReviewResponseDTO;
import com.mellsell.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public Page<ReviewResponseDTO> listPending(@RequestParam(name = "page", defaultValue = "0") int page,
                                               @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.listPending(pageable);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ReviewResponseDTO> approve(@PathVariable Long id) {
        ReviewResponseDTO dto = reviewService.approveReview(id);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ReviewResponseDTO> reject(@PathVariable Long id) {
        ReviewResponseDTO dto = reviewService.rejectReview(id);
        return ResponseEntity.ok(dto);
    }
}
