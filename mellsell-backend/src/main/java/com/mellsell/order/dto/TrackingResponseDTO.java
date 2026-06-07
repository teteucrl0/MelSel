package com.mellsell.order.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingResponseDTO {
    private Long orderId;
    private Long supplierId;
    private String supplierName;
    private String trackingCode;
    private String carrier;
    private String currentStatus;
    private String currentStatusLabel;
    private int progressPercent;
    private boolean delivered;
    private String source;
    private String correiosUrl;
    private LocalDateTime estimatedDelivery;
    private List<TrackingEventDTO> events;
}