package com.mellsell.cart.controller;

import com.mellsell.auth.entity.User;
import com.mellsell.auth.exception.ResourceNotFoundException;
import com.mellsell.auth.service.UserService;
import com.mellsell.cart.dto.AddCartItemRequest;
import com.mellsell.cart.dto.CartItemResponseDTO;
import com.mellsell.cart.dto.UpdateCartItemRequest;
import com.mellsell.cart.service.CartService;
import com.mellsell.order.dto.CheckoutRequest;
import com.mellsell.order.dto.CheckoutResponseDTO;
import com.mellsell.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserService userService;
    private final OrderService orderService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/items")
    public CartItemResponseDTO addItem(@Valid @RequestBody AddCartItemRequest req) {
        return cartService.addItem(currentUser(), req);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<CartItemResponseDTO> listCart() {
        return cartService.listCart(currentUser());
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/items/{id}")
    public CartItemResponseDTO updateItem(@PathVariable Long id, @Valid @RequestBody UpdateCartItemRequest req) {
        return cartService.updateItemQuantity(currentUser(), id, req.getQuantity());
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/items/{id}")
    public void removeItem(@PathVariable Long id) {
        cartService.removeItem(currentUser(), id);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/checkout")
    public CheckoutResponseDTO checkout(@Valid @RequestBody CheckoutRequest req) {
        return orderService.checkout(currentUser(), req);
    }
}
