package com.mellsell.report.service;

import com.mellsell.report.dto.SalesReportItemDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<SalesReportItemDTO> salesReport(LocalDate from, LocalDate to);
}
