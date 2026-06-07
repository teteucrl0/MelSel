package com.mellsell.order.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingEventDTO {
    private String status;
    private String title;
    private String description;
    private String location;
    private LocalDateTime occurredAt;
    private boolean completed;
}