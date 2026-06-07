package com.mellsell.order.controller;

import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.service.UserService;
import com.mellsell.order.dto.OrderResponseDTO;
import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<OrderResponseDTO> listOrders() {
        return orderService.listOrders(currentUser());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public OrderResponseDTO getOrder(@PathVariable Long id) {
        return orderService.getOrder(currentUser(), id);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/tracking")
    public TrackingResponseDTO getTracking(@PathVariable Long id) {
        return orderService.getTracking(currentUser(), id);
    }
}
