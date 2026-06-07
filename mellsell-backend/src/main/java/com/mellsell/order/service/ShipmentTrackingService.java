package com.mellsell.order.service;

import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.entity.Order;

public interface ShipmentTrackingService {
    String assignTrackingCode(Order order);

    TrackingResponseDTO getTracking(Order order);
}