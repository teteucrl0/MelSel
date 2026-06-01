package com.mellsell.cart.service;

import com.mellsell.cart.dto.AddCartItemRequest;
import com.mellsell.cart.dto.CartItemResponseDTO;
import com.mellsell.auth.entity.User;

import java.util.List;

public interface CartService {
    CartItemResponseDTO addItem(User user, AddCartItemRequest req);
    List<CartItemResponseDTO> listCart(User user);
    void removeItem(User user, Long cartItemId);
    void clearCart(User user);
}
