package com.mellsell.report.controller;

import com.mellsell.report.dto.SalesReportItemDTO;
import com.mellsell.report.service.ReportService;
import com.mellsell.auth.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final PdfService pdfService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/sales")
    public Object salesReport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "format", required = false) String format
    ) throws IOException {
        List<SalesReportItemDTO> items = reportService.salesReport(from, to);
        if ("pdf".equalsIgnoreCase(format)) {
            byte[] pdf = pdfService.generateSalesReportPdf(items, "Relatório de Vendas");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sales-report.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        }
        return items;
    }
}
