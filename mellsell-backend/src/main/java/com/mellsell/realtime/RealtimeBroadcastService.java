package com.mellsell.realtime;

import com.mellsell.catalog.dto.StockUpdateDTO;
import com.mellsell.catalog.entity.Product;
import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.entity.OrderItem;
import com.mellsell.realtime.dto.ApiaryEventDTO;
import com.mellsell.realtime.dto.VendorNotificationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RealtimeBroadcastService {

    public static final String TYPE_CART_RESERVE = "CART_RESERVE";
    public static final String TYPE_CART_RELEASE = "CART_RELEASE";
    public static final String TYPE_ORDER_CONFIRMED = "ORDER_CONFIRMED";
    public static final String TYPE_OUT_OF_STOCK = "OUT_OF_STOCK";

    public static final String TOPIC_INVENTORY = "/topic/inventory";
    public static final String TOPIC_APIARY = "/topic/apiary";
    public static final String TOPIC_VENDOR_NOTIFICATIONS = "/topic/vendor-notifications";

    public static String topicOrderTracking(Long orderId) {
        return "/topic/tracking/" + orderId;
    }

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastOrderTracking(Long orderId, TrackingResponseDTO tracking) {
        if (orderId == null || tracking == null) {
            return;
        }
        messagingTemplate.convertAndSend(topicOrderTracking(orderId), tracking);
    }

    public void broadcastInventory(Product product) {
        Long supplierId = product.getSupplier() != null ? product.getSupplier().getId() : null;
        messagingTemplate.convertAndSend(TOPIC_INVENTORY,
                StockUpdateDTO.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .stock(product.getStock())
                        .supplierId(supplierId)
                        .build());
    }

    /** Atualiza catálogo ao vivo e avisa o vendedor se o estoque acabou de zerar. */
    public void publishStockChange(Product product, int stockBefore) {
        broadcastInventory(product);
        if (stockBefore > 0 && product.getStock() != null && product.getStock() <= 0) {
            notifyVendorOutOfStock(product);
        }
    }

    public void broadcastApiaryStep(ApiaryEventDTO event) {
        messagingTemplate.convertAndSend(TOPIC_APIARY, event);
    }

    public void notifyVendorCartReservation(Product product, int quantityDelta, String customerHint) {
        if (product.getSupplier() == null) {
            return;
        }
        String action = quantityDelta > 0 ? "reserva" : "devolução";
        int absQty = Math.abs(quantityDelta);
        VendorNotificationDTO notification = VendorNotificationDTO.builder()
                .supplierId(product.getSupplier().getId())
                .supplierName(product.getSupplier().getName())
                .productId(product.getId())
                .productName(product.getName())
                .quantity(absQty)
                .stockRemaining(product.getStock())
                .type(quantityDelta > 0 ? TYPE_CART_RESERVE : TYPE_CART_RELEASE)
                .message(String.format(
                        "%d un. de \"%s\" — %s no carrinho%s. Estoque atual: %d",
                        absQty,
                        product.getName(),
                        action,
                        customerHint != null ? " (" + customerHint + ")" : "",
                        product.getStock()))
                .timestamp(Instant.now().toString())
                .build();
        messagingTemplate.convertAndSend(TOPIC_VENDOR_NOTIFICATIONS, notification);
    }

    public void notifyVendorOrderConfirmed(Product product, int quantity, String buyerName, Long orderId) {
        if (product.getSupplier() == null) {
            return;
        }
        VendorNotificationDTO notification = VendorNotificationDTO.builder()
                .supplierId(product.getSupplier().getId())
                .supplierName(product.getSupplier().getName())
                .orderId(orderId)
                .productId(product.getId())
                .productName(product.getName())
                .quantity(quantity)
                .stockRemaining(product.getStock())
                .type(TYPE_ORDER_CONFIRMED)
                .message(String.format(
                        "Pedido #%d confirmado — %d un. de \"%s\" por %s.",
                        orderId,
                        quantity,
                        product.getName(),
                        buyerName != null ? buyerName : "cliente"))
                .timestamp(Instant.now().toString())
                .build();
        messagingTemplate.convertAndSend(TOPIC_VENDOR_NOTIFICATIONS, notification);
    }

    /** Uma notificação por pedido do revendedor (checkout com vários itens). */
    public void notifyVendorOrderPlaced(
            Long supplierId,
            String supplierName,
            Long orderId,
            String buyerName,
            BigDecimal orderTotal,
            java.util.List<OrderItem> items) {
        if (supplierId == null || items == null || items.isEmpty()) {
            return;
        }
        String summary = items.stream()
                .map(oi -> oi.getQuantity() + "× " + oi.getProductName())
                .collect(Collectors.joining(", "));
        String buyer = buyerName != null && !buyerName.isBlank() ? buyerName : "Cliente";
        String total = orderTotal != null ? String.format("R$ %.2f", orderTotal) : "";
        VendorNotificationDTO notification = VendorNotificationDTO.builder()
                .supplierId(supplierId)
                .supplierName(supplierName)
                .orderId(orderId)
                .productId(items.get(0).getProductId())
                .productName(items.size() == 1 ? items.get(0).getProductName() : items.size() + " produtos")
                .quantity(items.stream().mapToInt(OrderItem::getQuantity).sum())
                .type(TYPE_ORDER_CONFIRMED)
                .message(String.format(
                        "Nova venda! Pedido #%d — %s comprou %s. Total %s.",
                        orderId,
                        buyer,
                        summary,
                        total))
                .timestamp(Instant.now().toString())
                .build();
        messagingTemplate.convertAndSend(TOPIC_VENDOR_NOTIFICATIONS, notification);
    }

    public void notifyVendorOutOfStock(Product product) {
        if (product.getSupplier() == null) {
            return;
        }
        VendorNotificationDTO notification = VendorNotificationDTO.builder()
                .supplierId(product.getSupplier().getId())
                .supplierName(product.getSupplier().getName())
                .productId(product.getId())
                .productName(product.getName())
                .stockRemaining(0)
                .type(TYPE_OUT_OF_STOCK)
                .message(String.format(
                        "\"%s\" esgotou — estoque zerado. Reposição necessária para voltar a vender.",
                        product.getName()))
                .timestamp(Instant.now().toString())
                .build();
        messagingTemplate.convertAndSend(TOPIC_VENDOR_NOTIFICATIONS, notification);
    }
}