package com.mellsell.cart.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.cart.dto.AddCartItemRequest;
import com.mellsell.cart.dto.CartItemResponseDTO;
import com.mellsell.cart.entity.CartItem;
import com.mellsell.cart.repository.CartItemRepository;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Override
    public CartItemResponseDTO addItem(User user, AddCartItemRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

        if (!Boolean.TRUE.equals(product.getActive()) || product.getSupplier() == null || !Boolean.TRUE.equals(product.getSupplier().getActive())) {
            throw new IllegalStateException("Produto indisponível");
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElse(null);
        if (item == null) {
            item = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(req.getQuantity())
                    .build();
        } else {
            item.setQuantity(item.getQuantity() + req.getQuantity());
        }

        item = cartItemRepository.save(item);

        BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponseDTO.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .unitPrice(product.getPrice())
                .quantity(item.getQuantity())
                .subtotal(subtotal)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItemResponseDTO> listCart(User user) {
        return cartItemRepository.findByUserId(user.getId()).stream().map(item ->
                CartItemResponseDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .unitPrice(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build()
        ).collect(Collectors.toList());
    }

    @Override
    public void removeItem(User user, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Item não pertence ao usuário");
        }
        cartItemRepository.delete(item);
    }

    @Override
    public void clearCart(User user) {
        cartItemRepository.deleteByUserId(user.getId());
    }
}
