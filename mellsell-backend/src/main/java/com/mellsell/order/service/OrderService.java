package com.mellsell.order.service;

import com.mellsell.auth.entity.User;
import com.mellsell.order.dto.CheckoutRequest;
import com.mellsell.order.dto.OrderResponseDTO;

import java.util.List;

public interface OrderService {
    OrderResponseDTO checkout(User user, CheckoutRequest req);
    List<OrderResponseDTO> listOrders(User user);
    OrderResponseDTO getOrder(User user, Long orderId);
}
