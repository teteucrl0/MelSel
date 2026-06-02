package com.mellsell.report.service.impl;

import com.mellsell.order.entity.Order;
import com.mellsell.order.entity.OrderItem;
import com.mellsell.order.repository.OrderRepository;
import com.mellsell.report.dto.SalesReportItemDTO;
import com.mellsell.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;

    @Override
    public List<SalesReportItemDTO> salesReport(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = (from == null) ? null : from.atStartOfDay();
        LocalDateTime toDt = (to == null) ? null : to.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findConfirmedBetween(fromDt, toDt);

        Map<Long, SalesReportItemDTO> map = new HashMap<>();

        for (Order o : orders) {
            for (OrderItem oi : o.getItems()) {
                SalesReportItemDTO item = map.get(oi.getProductId());
                if (item == null) {
                    item = SalesReportItemDTO.builder()
                            .productId(oi.getProductId())
                            .productName(oi.getProductName())
                            .quantitySold((long) oi.getQuantity())
                            .revenue(oi.getSubtotal())
                            .build();
                    map.put(oi.getProductId(), item);
                } else {
                    item.setQuantitySold(item.getQuantitySold() + oi.getQuantity());
                    item.setRevenue(item.getRevenue().add(oi.getSubtotal()));
                }
            }
        }

        return map.values().stream().sorted(Comparator.comparing(SalesReportItemDTO::getRevenue).reversed()).collect(Collectors.toList());
    }
}
