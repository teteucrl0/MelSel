package com.mellsell.order.service.impl;

import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderStatus;
import com.mellsell.order.repository.OrderRepository;
import com.mellsell.order.service.ShipmentTrackingLiveService;
import com.mellsell.order.service.ShipmentTrackingService;
import com.mellsell.realtime.RealtimeBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShipmentTrackingLiveServiceImpl implements ShipmentTrackingLiveService {

    private final OrderRepository orderRepository;
    private final ShipmentTrackingService shipmentTrackingService;
    private final RealtimeBroadcastService realtimeBroadcastService;

    @Value("${mellsell.tracking.live-enabled:false}")
    private boolean liveEnabled;

    @Value("${mellsell.tracking.step-interval-seconds:8}")
    private int stepIntervalSeconds;

    @Value("${mellsell.tracking.initial-delay-seconds:2}")
    private int initialDelaySeconds;

    private static final int MAX_STEPS = 5;

    @Override
    @Async
    public void startLiveTracking(Order order) {
        if (!liveEnabled || order == null || order.getId() == null) {
            return;
        }

        Long orderId = order.getId();
        for (int step = 1; step <= MAX_STEPS; step++) {
            long delayMs = step == 1 ? initialDelaySeconds * 1000L : stepIntervalSeconds * 1000L;
            sleep(delayMs);

            Order current = orderRepository.findById(orderId).orElse(null);
            if (current == null || current.getStatus() != OrderStatus.CONFIRMED) {
                return;
            }
            if (current.getTrackingStepsCompleted() != null && current.getTrackingStepsCompleted() >= step) {
                continue;
            }

            current.setTrackingStepsCompleted(step);
            orderRepository.save(current);

            TrackingResponseDTO tracking = shipmentTrackingService.getTracking(current);
            realtimeBroadcastService.broadcastOrderTracking(orderId, tracking);
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}