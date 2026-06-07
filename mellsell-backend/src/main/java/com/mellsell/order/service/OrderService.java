package com.mellsell.order.service;

import com.mellsell.auth.entity.User;
import com.mellsell.order.dto.CheckoutRequest;
import com.mellsell.order.dto.CheckoutResponseDTO;
import com.mellsell.order.dto.OrderResponseDTO;
import com.mellsell.order.dto.TrackingResponseDTO;

import java.util.List;

public interface OrderService {
    CheckoutResponseDTO checkout(User user, CheckoutRequest req);
    List<OrderResponseDTO> listOrders(User user);
    OrderResponseDTO getOrder(User user, Long orderId);
    TrackingResponseDTO getTracking(User user, Long orderId);
}
