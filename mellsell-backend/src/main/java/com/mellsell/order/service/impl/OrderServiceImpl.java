package com.mellsell.order.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.cart.entity.CartItem;
import com.mellsell.cart.repository.CartItemRepository;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.order.dto.CheckoutRequest;
import com.mellsell.order.dto.OrderResponseDTO;
import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderItem;
import com.mellsell.order.entity.OrderStatus;
import com.mellsell.order.exception.InsufficientStockException;
import com.mellsell.order.exception.SupplierInactiveException;
import com.mellsell.order.repository.OrderRepository;
import com.mellsell.order.repository.OrderItemRepository;
import com.mellsell.order.service.OrderService;
import com.mellsell.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentService paymentService;

    @Override
    @Transactional
    public OrderResponseDTO checkout(User user, CheckoutRequest req) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Carrinho vazio");
        }

        BigDecimal itemsTotal = cartItems.stream()
                .map(ci -> ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shipping = calculateShipping(itemsTotal);
        BigDecimal total = itemsTotal.add(shipping);

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .total(total)
                .shippingCost(shipping)
                .build();

        // persist order first (items will be attached after)
        order = orderRepository.save(order);

        // populate order items and attach
        List<OrderItem> orderItems = cartItems.stream().map(ci -> {
            return OrderItem.builder()
                    .productId(ci.getProduct().getId())
                    .productName(ci.getProduct().getName())
                    .unitPrice(ci.getProduct().getPrice())
                    .quantity(ci.getQuantity())
                    .subtotal(ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                    .build();
        }).collect(Collectors.toList());

        // attach order reference
        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
        }
        order.setItems(orderItems);
        orderRepository.save(order);

        // debit stock and validate suppliers
        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

            if (p.getSupplier() == null || !Boolean.TRUE.equals(p.getSupplier().getActive())) {
                throw new SupplierInactiveException("Fornecedor do produto está inativo: " + p.getId());
            }

            if (p.getStock() < ci.getQuantity()) {
                throw new InsufficientStockException("Estoque insuficiente para o produto: " + p.getId());
            }

            p.setStock(p.getStock() - ci.getQuantity());
            productRepository.save(p);
        }

        // process payment (fake)
        String txn = paymentService.processPayment(order.getTotal(), req.getPaymentMethod());
        boolean paid = txn != null && !txn.isBlank();

        if (!paid) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            throw new IllegalStateException("Pagamento recusado");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // clear cart
        cartItemRepository.deleteByUserId(user.getId());

        // build response
        OrderResponseDTO resp = OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .items(order.getItems().stream().map(oi -> OrderResponseDTO.OrderItemDTO.builder()
                        .productId(oi.getProductId())
                        .productName(oi.getProductName())
                        .unitPrice(oi.getUnitPrice())
                        .quantity(oi.getQuantity())
                        .subtotal(oi.getSubtotal())
                        .build()).collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .build();

        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> listOrders(User user) {
        return orderRepository.findByUserId(user.getId()).stream().map(order -> OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .items(order.getItems().stream().map(oi -> OrderResponseDTO.OrderItemDTO.builder()
                        .productId(oi.getProductId())
                        .productName(oi.getProductName())
                        .unitPrice(oi.getUnitPrice())
                        .quantity(oi.getQuantity())
                        .subtotal(oi.getSubtotal())
                        .build()).collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrder(User user, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Acesso negado ao pedido");
        }
        return OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .items(order.getItems().stream().map(oi -> OrderResponseDTO.OrderItemDTO.builder()
                        .productId(oi.getProductId())
                        .productName(oi.getProductName())
                        .unitPrice(oi.getUnitPrice())
                        .quantity(oi.getQuantity())
                        .subtotal(oi.getSubtotal())
                        .build()).collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .build();
    }

    private BigDecimal calculateShipping(BigDecimal itemsTotal) {
        // Simple fictitious frete: R$10 for orders under R$100, otherwise free
        if (itemsTotal.compareTo(BigDecimal.valueOf(100)) < 0) {
            return BigDecimal.valueOf(10);
        }
        return BigDecimal.ZERO;
    }
}
