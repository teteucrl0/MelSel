package com.mellsell.order.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.cart.entity.CartItem;
import com.mellsell.cart.repository.CartItemRepository;
import com.mellsell.catalog.entity.Coupon;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.CouponRepository;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
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
    private final CouponRepository couponRepository;

    @Override
    @Transactional(rollbackFor = {InsufficientStockException.class, SupplierInactiveException.class, Exception.class})
    public OrderResponseDTO checkout(User user, CheckoutRequest req) {
        // a. Carregar cartItems
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Carrinho vazio");
        }

        // b. Validar fornecedor e estoque de TODOS os itens antes de salvar qualquer coisa
        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

            if (p.getSupplier() == null || !Boolean.TRUE.equals(p.getSupplier().getActive())) {
                throw new SupplierInactiveException("Fornecedor do produto está inativo: " + p.getId());
            }

            if (p.getStock() < ci.getQuantity()) {
                throw new InsufficientStockException("Estoque insuficiente para o produto: " + p.getId());
            }
        }

        // c. Calcular total (com desconto do cupom se houver)
        BigDecimal itemsTotal = cartItems.stream()
                .map(ci -> ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shipping = calculateShipping(itemsTotal);

        BigDecimal discount = BigDecimal.ZERO;
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCode(req.getCouponCode())
                    .orElseThrow(() -> new IllegalArgumentException("Cupom não encontrado: " + req.getCouponCode()));
            LocalDateTime now = LocalDateTime.now();
            if (!Boolean.TRUE.equals(coupon.getActive())
                    || now.isBefore(coupon.getValidFrom())
                    || now.isAfter(coupon.getValidUntil())
                    || coupon.getUsedCount() >= coupon.getMaxUses()) {
                throw new IllegalArgumentException("Cupom inválido ou expirado: " + req.getCouponCode());
            }
            discount = itemsTotal.multiply(BigDecimal.valueOf(coupon.getDiscountPercentage()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        BigDecimal total = itemsTotal.subtract(discount).add(shipping);

        // d. Criar e salvar o Order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .total(total)
                .shippingCost(shipping)
                .discount(discount)
                .build();
        order = orderRepository.save(order);

        // e. Criar e salvar os OrderItems
        List<OrderItem> orderItems = cartItems.stream().map(ci -> OrderItem.builder()
                .order(order)
                .productId(ci.getProduct().getId())
                .productName(ci.getProduct().getName())
                .unitPrice(ci.getProduct().getPrice())
                .quantity(ci.getQuantity())
                .subtotal(ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                .build()).collect(Collectors.toList());
        order.setItems(orderItems);
        orderRepository.save(order);

        // f. Debitar estoque de todos os produtos
        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
            p.setStock(p.getStock() - ci.getQuantity());
            productRepository.save(p);
        }

        // g. Processar pagamento
        String txn = paymentService.processPayment(order.getTotal(), req.getPaymentMethod());
        boolean paid = txn != null && !txn.isBlank();

        if (!paid) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            throw new IllegalStateException("Pagamento recusado");
        }

        // h. Confirmar order status
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // i. Limpar carrinho
        cartItemRepository.deleteByUserId(user.getId());

        return OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .discount(order.getDiscount())
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

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> listOrders(User user) {
        return orderRepository.findByUserId(user.getId()).stream().map(order -> OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .discount(order.getDiscount())
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
                .discount(order.getDiscount())
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
        if (itemsTotal.compareTo(BigDecimal.valueOf(100)) < 0) {
            return BigDecimal.valueOf(10);
        }
        return BigDecimal.ZERO;
    }
}
