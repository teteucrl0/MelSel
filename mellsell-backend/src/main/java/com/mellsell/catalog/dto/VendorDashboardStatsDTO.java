package com.mellsell.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDashboardStatsDTO {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private int productCount;
    private BigDecimal revenueLast7Days;
    private List<VendorSalesDayDTO> salesLast7Days;
    private List<VendorRecentOrderDTO> recentOrders;
}