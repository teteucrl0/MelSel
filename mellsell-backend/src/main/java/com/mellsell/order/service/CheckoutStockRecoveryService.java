package com.mellsell.order.service;

import com.mellsell.cart.entity.CartItem;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.realtime.RealtimeBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Restaura estoque reservado no carrinho em transação independente,
 * para que a devolução persista mesmo quando o checkout principal faz rollback.
 */
@Service
@RequiredArgsConstructor
public class CheckoutStockRecoveryService {

    private final ProductRepository productRepository;
    private final RealtimeBroadcastService realtimeBroadcastService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void restoreReservedStock(List<CartItem> cartItems) {
        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
            p.setStock(p.getStock() + ci.getQuantity());
            productRepository.save(p);
            realtimeBroadcastService.broadcastInventory(p);
        }
    }
}