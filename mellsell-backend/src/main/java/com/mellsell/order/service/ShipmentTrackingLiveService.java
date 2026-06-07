package com.mellsell.order.service;

import com.mellsell.order.entity.Order;

public interface ShipmentTrackingLiveService {
    void startLiveTracking(Order order);
}