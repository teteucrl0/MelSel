package com.mellsell.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiaryEventDTO {
    private String stepId;
    private String title;
    private String message;
    private int progress;
    private String storeName;
    private String vendorName;
    private boolean completed;
}