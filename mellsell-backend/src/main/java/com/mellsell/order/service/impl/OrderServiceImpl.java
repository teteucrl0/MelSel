package com.mellsell.order.service.impl;

import com.mellsell.auth.entity.User;
import com.mellsell.cart.entity.CartItem;
import com.mellsell.cart.repository.CartItemRepository;
import com.mellsell.catalog.entity.Coupon;
import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.exception.ResourceNotFoundException;
import com.mellsell.catalog.repository.CouponRepository;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.common.util.InputSanitizer;
import com.mellsell.order.dto.CheckoutRequest;
import com.mellsell.order.dto.CheckoutResponseDTO;
import com.mellsell.order.dto.OrderResponseDTO;
import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.service.ShipmentTrackingLiveService;
import com.mellsell.order.service.ShipmentTrackingService;
import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderItem;
import com.mellsell.order.entity.OrderStatus;
import com.mellsell.order.exception.InsufficientStockException;
import com.mellsell.order.exception.SupplierInactiveException;
import com.mellsell.order.repository.OrderRepository;
import com.mellsell.order.service.CheckoutStockRecoveryService;
import com.mellsell.order.service.OrderService;
import com.mellsell.payment.CreditCardValidator;
import com.mellsell.payment.dto.CreditCardDto;
import com.mellsell.payment.service.PaymentService;
import com.mellsell.realtime.RealtimeBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final CouponRepository couponRepository;
    private final RealtimeBroadcastService realtimeBroadcastService;
    private final ShipmentTrackingService shipmentTrackingService;
    private final ShipmentTrackingLiveService shipmentTrackingLiveService;
    private final CheckoutStockRecoveryService checkoutStockRecoveryService;

    @Override
    @Transactional(rollbackFor = {InsufficientStockException.class, SupplierInactiveException.class})
    public CheckoutResponseDTO checkout(User user, CheckoutRequest req) {
        req.setShippingAddress(InputSanitizer.requireSafeShippingAddress(req.getShippingAddress()));
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Seu carrinho está vazio. Adicione produtos antes de finalizar.");
        }

        validatePaymentBeforeCheckout(req);

        List<SupplierCartGroup> groups = buildSupplierGroups(cartItems, user);

        BigDecimal itemsTotal = groups.stream()
                .map(SupplierCartGroup::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountPreview = previewDiscount(req.getCouponCode(), itemsTotal);
        BigDecimal shippingTotal = groups.stream()
                .map(g -> calculateShipping(g.subtotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal grandTotal = itemsTotal.subtract(discountPreview).add(shippingTotal);

        String txn = paymentService.processPayment(grandTotal, req.getPaymentMethod(), req.getCreditCard());
        boolean paid = txn != null && !txn.isBlank();

        if (!paid) {
            checkoutStockRecoveryService.restoreReservedStock(cartItems);
            throw new IllegalStateException(
                    "Pagamento recusado. Verifique os dados do cartão ou tente outra forma de pagamento.");
        }

        BigDecimal discount = applyDiscount(req.getCouponCode(), itemsTotal);
        List<OrderResponseDTO> confirmedDtos = new ArrayList<>();
        BigDecimal discountRemaining = discount;

        for (int i = 0; i < groups.size(); i++) {
            SupplierCartGroup group = groups.get(i);
            BigDecimal groupDiscount = allocateDiscount(group.subtotal(), itemsTotal, discount, discountRemaining, i == groups.size() - 1);
            if (i == groups.size() - 1) {
                discountRemaining = BigDecimal.ZERO;
            } else {
                discountRemaining = discountRemaining.subtract(groupDiscount);
            }
            BigDecimal groupShipping = calculateShipping(group.subtotal());
            BigDecimal groupTotal = group.subtotal().subtract(groupDiscount).add(groupShipping);

            Order order = Order.builder()
                    .user(user)
                    .status(OrderStatus.CONFIRMED)
                    .total(groupTotal)
                    .shippingCost(groupShipping)
                    .discount(groupDiscount)
                    .shippingAddress(req.getShippingAddress())
                    .supplierId(group.supplierId())
                    .supplierName(group.supplierName())
                    .build();

            List<OrderItem> orderItems = group.items().stream().map(ci -> {
                Product p = ci.getProduct();
                return OrderItem.builder()
                        .order(order)
                        .productId(p.getId())
                        .productName(p.getName())
                        .supplierId(group.supplierId())
                        .supplierName(group.supplierName())
                        .unitPrice(p.getPrice())
                        .quantity(ci.getQuantity())
                        .subtotal(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                        .build();
            }).collect(Collectors.toList());

            order.setItems(orderItems);
            shipmentTrackingService.assignTrackingCode(order);
            order.setTrackingStepsCompleted(0);
            order = orderRepository.save(order);
            shipmentTrackingLiveService.startLiveTracking(order);

            realtimeBroadcastService.notifyVendorOrderPlaced(
                    order.getSupplierId(),
                    order.getSupplierName(),
                    order.getId(),
                    user.getName(),
                    order.getTotal(),
                    order.getItems());
            confirmedDtos.add(toDto(order));
        }

        cartItemRepository.deleteByUserId(user.getId());

        return CheckoutResponseDTO.builder()
                .orders(confirmedDtos)
                .totalPaid(grandTotal)
                .orderCount(confirmedDtos.size())
                .build();
    }

    private void validatePaymentBeforeCheckout(CheckoutRequest req) {
        String method = req.getPaymentMethod() == null ? "" : req.getPaymentMethod().trim();
        if (method.isBlank()) {
            throw new IllegalArgumentException("Selecione uma forma de pagamento");
        }
        if ("CREDIT_CARD".equalsIgnoreCase(method)) {
            CreditCardDto card = req.getCreditCard();
            if (card == null) {
                throw new IllegalArgumentException("Informe os dados do cartão de crédito");
            }
            CreditCardValidator.validate(card);
        }
    }

    private List<SupplierCartGroup> buildSupplierGroups(List<CartItem> cartItems, User user) {
        Map<Long, SupplierCartGroup> map = new LinkedHashMap<>();

        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

            if (p.getSupplier() == null || !Boolean.TRUE.equals(p.getSupplier().getActive())) {
                throw new SupplierInactiveException("Fornecedor do produto está inativo: " + p.getId());
            }
            int available = p.getStock() != null ? p.getStock() : 0;
            if (available < ci.getQuantity()) {
                throw new InsufficientStockException("Estoque insuficiente para \"" + p.getName() + "\"");
            }
            if (p.getSupplier().getOwner() != null && Objects.equals(p.getSupplier().getOwner().getId(), user.getId())) {
                throw new IllegalStateException("Não é possível finalizar compra dos seus próprios produtos");
            }

            Supplier supplier = p.getSupplier();
            Long supplierId = supplier.getId();
            map.computeIfAbsent(supplierId, id -> new SupplierCartGroup(
                    id,
                    supplier.getName(),
                    new ArrayList<>()
            )).items().add(ci);
        }

        return new ArrayList<>(map.values());
    }

    private BigDecimal previewDiscount(String couponCode, BigDecimal itemsTotal) {
        Coupon coupon = findValidCoupon(couponCode);
        if (coupon == null) {
            return BigDecimal.ZERO;
        }
        return discountAmount(coupon, itemsTotal);
    }

    private BigDecimal applyDiscount(String couponCode, BigDecimal itemsTotal) {
        Coupon coupon = findValidCoupon(couponCode);
        if (coupon == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal discount = discountAmount(coupon, itemsTotal);
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
        return discount;
    }

    private Coupon findValidCoupon(String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return null;
        }
        Coupon coupon = couponRepository.findByCode(couponCode.trim())
                .orElseThrow(() -> new IllegalArgumentException("Cupom não encontrado"));
        var now = java.time.LocalDateTime.now();
        if (!Boolean.TRUE.equals(coupon.getActive())
                || now.isBefore(coupon.getValidFrom())
                || now.isAfter(coupon.getValidUntil())
                || coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new IllegalArgumentException("Cupom inválido ou expirado");
        }
        return coupon;
    }

    private static BigDecimal discountAmount(Coupon coupon, BigDecimal itemsTotal) {
        return itemsTotal.multiply(BigDecimal.valueOf(coupon.getDiscountPercentage()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal allocateDiscount(
            BigDecimal groupSubtotal,
            BigDecimal itemsTotal,
            BigDecimal totalDiscount,
            BigDecimal discountRemaining,
            boolean lastGroup) {
        if (totalDiscount.compareTo(BigDecimal.ZERO) == 0 || itemsTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (lastGroup) {
            return discountRemaining.max(BigDecimal.ZERO);
        }
        return totalDiscount.multiply(groupSubtotal)
                .divide(itemsTotal, 2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> listOrders(User user) {
        return orderRepository.findByUserId(user.getId()).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrder(User user, Long orderId) {
        return toDto(requireOwnedOrder(user, orderId));
    }

    @Override
    @Transactional
    public TrackingResponseDTO getTracking(User user, Long orderId) {
        Order order = requireOwnedOrder(user, orderId);
        if (order.getStatus() == OrderStatus.CONFIRMED
                && (order.getTrackingCode() == null || order.getTrackingCode().isBlank())) {
            shipmentTrackingService.assignTrackingCode(order);
            orderRepository.save(order);
        }
        return shipmentTrackingService.getTracking(order);
    }

    private Order requireOwnedOrder(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Acesso negado ao pedido");
        }
        return order;
    }

    private OrderResponseDTO toDto(Order order) {
        OrderResponseDTO.OrderResponseDTOBuilder builder = OrderResponseDTO.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .total(order.getTotal())
                .shippingCost(order.getShippingCost())
                .discount(order.getDiscount())
                .shippingAddress(order.getShippingAddress())
                .supplierId(order.getSupplierId())
                .supplierName(order.getSupplierName())
                .trackingCode(order.getTrackingCode())
                .carrier(order.getCarrier())
                .items(order.getItems().stream().map(oi -> OrderResponseDTO.OrderItemDTO.builder()
                        .productId(oi.getProductId())
                        .supplierId(oi.getSupplierId())
                        .supplierName(oi.getSupplierName())
                        .productName(oi.getProductName())
                        .unitPrice(oi.getUnitPrice())
                        .quantity(oi.getQuantity())
                        .subtotal(oi.getSubtotal())
                        .build()).collect(Collectors.toList()))
                .createdAt(order.getCreatedAt());

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            try {
                if (order.getTrackingCode() == null || order.getTrackingCode().isBlank()) {
                    builder.trackingCode(String.format("ME%09dBR", order.getId()));
                }
                TrackingResponseDTO tracking = shipmentTrackingService.getTracking(order);
                builder
                        .deliveryStatus(tracking.getCurrentStatusLabel())
                        .deliveryProgress(tracking.getProgressPercent());
                if (order.getTrackingCode() == null || order.getTrackingCode().isBlank()) {
                    builder.trackingCode(tracking.getTrackingCode());
                }
            } catch (Exception ignored) {
                builder
                        .trackingCode(order.getTrackingCode() != null
                                ? order.getTrackingCode()
                                : String.format("ME%09dBR", order.getId()))
                        .deliveryStatus("Aguardando envio")
                        .deliveryProgress(0);
            }
        }

        return builder.build();
    }

    private BigDecimal calculateShipping(BigDecimal itemsTotal) {
        if (itemsTotal.compareTo(BigDecimal.valueOf(100)) < 0) {
            return BigDecimal.valueOf(10);
        }
        return BigDecimal.ZERO;
    }

    private record SupplierCartGroup(Long supplierId, String supplierName, List<CartItem> items) {
        BigDecimal subtotal() {
            return items.stream()
                    .map(ci -> ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }
}