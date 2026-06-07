package com.mellsell.cart.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.cart.dto.AddCartItemRequest;
import com.mellsell.cart.dto.CartItemResponseDTO;
import com.mellsell.cart.entity.CartItem;
import com.mellsell.cart.repository.CartItemRepository;
import com.mellsell.cart.service.CartService;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.order.exception.InsufficientStockException;
import com.mellsell.realtime.RealtimeBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final RealtimeBroadcastService realtimeBroadcastService;

    @Override
    public CartItemResponseDTO addItem(User user, AddCartItemRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        if (!Boolean.TRUE.equals(product.getActive()) || product.getSupplier() == null || !Boolean.TRUE.equals(product.getSupplier().getActive())) {
            throw new IllegalStateException("Produto indisponível");
        }
        ensureNotOwnProduct(user, product);

        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElse(CartItem.builder().user(user).product(product).quantity(0).build());

        int previousQty = item.getQuantity() != null ? item.getQuantity() : 0;
        int newQty = previousQty + req.getQuantity();
        int delta = newQty - previousQty;

        applyStockDelta(product, delta, user.getName());

        item.setQuantity(newQty);
        item = cartItemRepository.save(item);

        return toDto(item, product);
    }

    @Override
    public CartItemResponseDTO updateItemQuantity(User user, Long cartItemId, int newQuantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Item não pertence ao usuário");
        }

        Product product = productRepository.findById(item.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

        int previousQty = item.getQuantity();
        int delta = newQuantity - previousQty;
        if (delta > 0) {
            ensureNotOwnProduct(user, product);
        }
        if (delta != 0) {
            applyStockDelta(product, delta, user.getName());
        }

        item.setQuantity(newQuantity);
        item = cartItemRepository.save(item);

        return toDto(item, product);
    }

    private CartItemResponseDTO toDto(CartItem item, Product product) {
        return CartItemResponseDTO.builder()
                .id(item.getId())
                .productId(product.getId())
                .supplierId(product.getSupplier() != null ? product.getSupplier().getId() : null)
                .supplierName(product.getSupplier() != null ? product.getSupplier().getName() : null)
                .productName(product.getName())
                .unitPrice(product.getPrice())
                .quantity(item.getQuantity())
                .subtotal(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .stockRemaining(product.getStock())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItemResponseDTO> listCart(User user) {
        return cartItemRepository.findByUserId(user.getId()).stream().map(item ->
                CartItemResponseDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .supplierId(item.getProduct().getSupplier() != null ? item.getProduct().getSupplier().getId() : null)
                        .supplierName(item.getProduct().getSupplier() != null ? item.getProduct().getSupplier().getName() : null)
                        .productName(item.getProduct().getName())
                        .unitPrice(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build()
        ).toList();
    }

    @Override
    public void removeItem(User user, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Item não pertence ao usuário");
        }

        Product product = productRepository.findById(item.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        int qty = item.getQuantity();
        if (qty > 0) {
            applyStockDelta(product, -qty, user.getName());
        }
        cartItemRepository.delete(item);
    }

    @Override
    public void clearCart(User user) {
        List<CartItem> items = cartItemRepository.findByUserId(user.getId());
        for (CartItem item : items) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
            if (item.getQuantity() > 0) {
                applyStockDelta(product, -item.getQuantity(), user.getName());
            }
        }
        cartItemRepository.deleteByUserId(user.getId());
    }

    private void ensureNotOwnProduct(User user, Product product) {
        if (product.getSupplier() != null
                && product.getSupplier().getOwner() != null
                && Objects.equals(product.getSupplier().getOwner().getId(), user.getId())) {
            throw new IllegalStateException("Você não pode comprar produtos da sua própria loja");
        }
    }

    private void applyStockDelta(Product product, int delta, String customerHint) {
        if (delta == 0) {
            return;
        }
        int stockBefore = product.getStock() != null ? product.getStock() : 0;
        int newStock = stockBefore - delta;
        if (newStock < 0) {
            throw new InsufficientStockException("Estoque insuficiente para \"" + product.getName() + "\"");
        }
        product.setStock(newStock);
        productRepository.save(product);
        realtimeBroadcastService.publishStockChange(product, stockBefore);
        realtimeBroadcastService.notifyVendorCartReservation(product, delta, customerHint);
    }
}