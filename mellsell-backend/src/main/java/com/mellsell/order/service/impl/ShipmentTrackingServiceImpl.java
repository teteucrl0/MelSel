package com.mellsell.order.service.impl;

import com.mellsell.order.dto.TrackingEventDTO;
import com.mellsell.order.dto.TrackingResponseDTO;
import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderStatus;
import com.mellsell.order.service.ShipmentTrackingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShipmentTrackingServiceImpl implements ShipmentTrackingService {

    private static final String CARRIER = "Correios";

    @Value("${mellsell.tracking.mode:simulated}")
    private String trackingMode;

    @Value("${mellsell.tracking.live-enabled:false}")
    private boolean liveEnabled;

    @Override
    public String assignTrackingCode(Order order) {
        if (order.getTrackingCode() != null && !order.getTrackingCode().isBlank()) {
            if (order.getCarrier() == null || order.getCarrier().isBlank()) {
                order.setCarrier(CARRIER);
            }
            return order.getTrackingCode().trim();
        }
        String code = String.format("ME%09dBR", order.getId());
        order.setTrackingCode(code);
        if (order.getCarrier() == null || order.getCarrier().isBlank()) {
            order.setCarrier(CARRIER);
        }
        return code;
    }

    @Override
    public TrackingResponseDTO getTracking(Order order) {
        String code = resolveTrackingCode(order);
        String carrier = resolveCarrier(order);

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            return TrackingResponseDTO.builder()
                    .orderId(order.getId())
                    .supplierId(order.getSupplierId())
                    .supplierName(order.getSupplierName())
                    .trackingCode(code)
                    .carrier(carrier)
                    .currentStatus("UNAVAILABLE")
                    .currentStatusLabel("Rastreamento indisponível")
                    .progressPercent(0)
                    .delivered(false)
                    .source("none")
                    .correiosUrl(correiosUrlFor(code, carrier))
                    .events(List.of())
                    .build();
        }

        if (order.getTrackingCode() == null || order.getTrackingCode().isBlank()) {
            code = assignTrackingCode(order);
            carrier = resolveCarrier(order);
        }

        LocalDateTime base = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        int stepsCompleted = order.getTrackingStepsCompleted() != null ? order.getTrackingStepsCompleted() : 0;
        List<TrackingEventDTO> events = liveEnabled
                ? buildTimelineBySteps(stepsCompleted, base)
                : buildTimelineByElapsedHours(base);
        int completed = (int) events.stream().filter(TrackingEventDTO::isCompleted).count();
        int progress = computeProgressPercent(completed, events.size());
        TrackingEventDTO current = resolveCurrentEvent(events);
        boolean delivered = events.stream().anyMatch(e -> "DELIVERED".equals(e.getStatus()) && e.isCompleted());

        String source = resolveSource();

        return TrackingResponseDTO.builder()
                .orderId(order.getId())
                .supplierId(order.getSupplierId())
                .supplierName(order.getSupplierName())
                .trackingCode(code)
                .carrier(carrier)
                .currentStatus(current.getStatus())
                .currentStatusLabel(resolveCurrentStatusLabel(current, completed, delivered))
                .progressPercent(progress)
                .delivered(delivered)
                .source(source)
                .correiosUrl(correiosUrlFor(code, carrier))
                .estimatedDelivery(base.plusDays(3))
                .events(events)
                .build();
    }

    private String resolveTrackingCode(Order order) {
        if (order.getTrackingCode() != null && !order.getTrackingCode().isBlank()) {
            return order.getTrackingCode().trim();
        }
        if (order.getId() != null) {
            return String.format("ME%09dBR", order.getId());
        }
        return null;
    }

    private String resolveCarrier(Order order) {
        if (order.getCarrier() != null && !order.getCarrier().isBlank()) {
            return order.getCarrier().trim();
        }
        return CARRIER;
    }

    private String resolveSource() {
        if (liveEnabled) {
            return "live";
        }
        if ("simulated".equalsIgnoreCase(trackingMode)) {
            return "simulated";
        }
        return trackingMode != null && !trackingMode.isBlank() ? trackingMode.trim() : "simulated";
    }

    private static int computeProgressPercent(int completedSteps, int totalSteps) {
        if (totalSteps <= 0) {
            return 0;
        }
        return Math.min(100, (int) Math.round(completedSteps * 100.0 / totalSteps));
    }

    private static TrackingEventDTO resolveCurrentEvent(List<TrackingEventDTO> events) {
        if (events.isEmpty()) {
            return TrackingEventDTO.builder()
                    .status("PENDING")
                    .title("Aguardando envio")
                    .build();
        }
        return events.stream()
                .filter(TrackingEventDTO::isCompleted)
                .reduce((a, b) -> b)
                .orElseGet(() -> events.stream()
                        .filter(e -> !e.isCompleted())
                        .findFirst()
                        .orElse(events.get(0)));
    }

    private static String resolveCurrentStatusLabel(TrackingEventDTO current, int completedSteps, boolean delivered) {
        if (delivered) {
            return "Entregue";
        }
        if (completedSteps == 0) {
            return "Aguardando envio";
        }
        return current.getTitle();
    }

    private static String correiosUrlFor(String trackingCode, String carrier) {
        if (trackingCode == null || trackingCode.isBlank()) {
            return null;
        }
        String c = carrier != null ? carrier.toLowerCase() : "";
        if (!c.isBlank() && !c.contains("correio")) {
            return null;
        }
        return "https://rastreamento.correios.com.br/app/index.php?objetos=" + trackingCode.trim();
    }

    private List<TrackingEventDTO> buildTimelineBySteps(int stepsCompleted, LocalDateTime postedAt) {
        List<Step> steps = trackingSteps();
        List<TrackingEventDTO> events = new ArrayList<>();
        for (int i = 0; i < steps.size(); i++) {
            Step step = steps.get(i);
            boolean done = stepsCompleted > i;
            events.add(TrackingEventDTO.builder()
                    .status(step.status)
                    .title(step.title)
                    .description(step.description)
                    .location(step.location)
                    .occurredAt(done ? postedAt.plusSeconds((i + 1L) * (liveEnabled ? 8L : 3600L)) : null)
                    .completed(done)
                    .build());
        }
        return events;
    }

    private List<TrackingEventDTO> buildTimelineByElapsedHours(LocalDateTime postedAt) {
        Duration elapsed = Duration.between(postedAt, LocalDateTime.now());
        long hours = Math.max(0, elapsed.toHours());

        List<TrackingEventDTO> events = new ArrayList<>();
        for (Step step : trackingSteps()) {
            boolean done = hours >= step.afterHours;
            events.add(TrackingEventDTO.builder()
                    .status(step.status)
                    .title(step.title)
                    .description(step.description)
                    .location(step.location)
                    .occurredAt(done ? postedAt.plusHours(step.afterHours) : null)
                    .completed(done)
                    .build());
        }
        return events;
    }

    private static List<Step> trackingSteps() {
        return List.of(
                new Step("POSTED", "Postado", "Objeto postado após o pagamento", "Agência dos Correios", 0),
                new Step("IN_TRANSIT", "Em trânsito", "Objeto encaminhado para unidade de tratamento", "Unidade logística — SP", 2),
                new Step("REGIONAL_HUB", "Centro regional", "Objeto chegou ao centro de distribuição", "Centro de distribuição — destino", 8),
                new Step("OUT_FOR_DELIVERY", "Saiu para entrega", "Objeto saiu para entrega ao destinatário", "Unidade de entrega", 24),
                new Step("DELIVERED", "Entregue", "Objeto entregue ao destinatário", "Endereço de entrega", 48)
        );
    }

    private record Step(String status, String title, String description, String location, long afterHours) {}
}