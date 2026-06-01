package com.mellsell.auth.service;

import com.mellsell.auth.dto.AdminUserResponseDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.mellsell.report.dto.SalesReportItemDTO;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfService {

    public byte[] generateUsersPdf(List<AdminUserResponseDTO> users, String title) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float margin = 50;
            float yStart = page.getMediaBox().getHeight() - margin;
            float yPosition = yStart;

            // Header
            cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
            cs.beginText();
            cs.newLineAtOffset(margin, yPosition);
            cs.showText(title != null ? title : "Usuários");
            cs.endText();

            yPosition -= 18;

            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.beginText();
            cs.newLineAtOffset(margin, yPosition);
            cs.showText("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            cs.endText();

            yPosition -= 18;

            // Table columns widths
            float tableWidth = page.getMediaBox().getWidth() - margin * 2;
            float colId = 40; // ID
            float colName = 140; // Nome
            float colEmail = 200; // Email
            float colRoles = 110; // Roles
            float colActive = 40; // Active
            float colLocked = 40; // Locked
            float rowHeight = 14f;

            // Draw table header
            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            float x = margin;
            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("ID");
            cs.endText();
            x += colId;

            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("Nome");
            cs.endText();
            x += colName;

            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("Email");
            cs.endText();
            x += colEmail;

            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("Roles");
            cs.endText();
            x += colRoles;

            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("Ativo");
            cs.endText();
            x += colActive;

            cs.beginText();
            cs.newLineAtOffset(x, yPosition);
            cs.showText("Bloq");
            cs.endText();

            yPosition -= (rowHeight + 4);

            cs.setFont(PDType1Font.HELVETICA, 10);

            for (AdminUserResponseDTO u : users) {
                if (yPosition < margin + 60) {
                    cs.close();
                    page = new PDPage(PDRectangle.LETTER);
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    yPosition = yStart - 20; // leave space for header

                    // redraw table header on new page
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
                    x = margin;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("ID"); cs.endText(); x += colId;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Nome"); cs.endText(); x += colName;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Email"); cs.endText(); x += colEmail;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Roles"); cs.endText(); x += colRoles;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Ativo"); cs.endText(); x += colActive;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Bloq"); cs.endText();
                    yPosition -= (rowHeight + 4);
                    cs.setFont(PDType1Font.HELVETICA, 10);
                }

                String roles = u.getRoles() == null ? "" : String.join(",", u.getRoles());
                String idStr = u.getId() == null ? "" : u.getId().toString();
                String ativo = String.valueOf(u.getActive());
                String bloqueado = String.valueOf(u.getLocked());

                List<String> nameLines = wrapText(PDType1Font.HELVETICA, 10, safe(u.getName()), colName - 4);
                List<String> emailLines = wrapText(PDType1Font.HELVETICA, 10, safe(u.getEmail()), colEmail - 4);
                List<String> rolesLines = wrapText(PDType1Font.HELVETICA, 10, roles, colRoles - 4);

                int maxLines = Math.max(Math.max(nameLines.size(), emailLines.size()), Math.max(rolesLines.size(), 1));

                for (int i = 0; i < maxLines; i++) {
                    x = margin;
                    // ID only on first line
                    if (i == 0) {
                        cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(idStr); cs.endText();
                    }
                    x += colId;

                    String nameLine = i < nameLines.size() ? nameLines.get(i) : "";
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(nameLine); cs.endText();
                    x += colName;

                    String emailLine = i < emailLines.size() ? emailLines.get(i) : "";
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(emailLine); cs.endText();
                    x += colEmail;

                    String rolesLine = i < rolesLines.size() ? rolesLines.get(i) : "";
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(rolesLine); cs.endText();
                    x += colRoles;

                    if (i == 0) {
                        cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(ativo); cs.endText();
                        x += colActive;
                        cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(bloqueado); cs.endText();
                    }

                    yPosition -= rowHeight;
                }
                yPosition -= 4; // gap between rows
            }

            cs.close();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    private List<String> wrapText(org.apache.pdfbox.pdmodel.font.PDFont font, float fontSize, String text, float width) throws IOException {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isBlank()) return lines;
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        for (String word : words) {
            String candidate = line.length() == 0 ? word : line.toString() + " " + word;
            float size = font.getStringWidth(candidate) / 1000 * fontSize;
            if (size > width) {
                if (line.length() == 0) {
                    // word itself too long -> break it
                    lines.addAll(breakWord(font, fontSize, word, width));
                } else {
                    lines.add(line.toString());
                    line = new StringBuilder(word);
                }
            } else {
                if (line.length() > 0) line.append(" ");
                line.append(word);
            }
        }
        if (line.length() > 0) lines.add(line.toString());
        return lines;
    }

    private List<String> breakWord(org.apache.pdfbox.pdmodel.font.PDFont font, float fontSize, String word, float width) throws IOException {
        List<String> parts = new ArrayList<>();
        int start = 0;
        for (int end = 1; end <= word.length(); end++) {
            String sub = word.substring(start, end);
            float size = font.getStringWidth(sub) / 1000 * fontSize;
            if (size > width) {
                if (start == end - 1) {
                    // single char too wide, still add
                    parts.add(sub);
                    start = end;
                } else {
                    parts.add(word.substring(start, end - 1));
                    start = end - 1;
                }
            } else if (end == word.length()) {
                parts.add(word.substring(start, end));
            }
        }
        return parts;
    }

    public byte[] generateSalesReportPdf(List<SalesReportItemDTO> items, String title) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float margin = 50;
            float yStart = page.getMediaBox().getHeight() - margin;
            float yPosition = yStart;

            // Header
            cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
            cs.beginText();
            cs.newLineAtOffset(margin, yPosition);
            cs.showText(title != null ? title : "Relatório de Vendas");
            cs.endText();

            yPosition -= 18;

            cs.setFont(PDType1Font.HELVETICA, 9);
            cs.beginText();
            cs.newLineAtOffset(margin, yPosition);
            cs.showText("Gerado em: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            cs.endText();

            yPosition -= 18;

            float colId = 50;
            float colName = 260;
            float colQty = 80;
            float colRevenue = 100;
            float rowHeight = 14f;

            cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
            float x = margin;
            cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Produto ID"); cs.endText(); x += colId;
            cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Produto"); cs.endText(); x += colName;
            cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Qtd vendida"); cs.endText(); x += colQty;
            cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Receita"); cs.endText();

            yPosition -= (rowHeight + 4);
            cs.setFont(PDType1Font.HELVETICA, 10);

            for (SalesReportItemDTO it : items) {
                if (yPosition < margin + 60) {
                    cs.close();
                    page = new PDPage(PDRectangle.LETTER);
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    yPosition = yStart - 20;
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
                    x = margin;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Produto ID"); cs.endText(); x += colId;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Produto"); cs.endText(); x += colName;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Qtd vendida"); cs.endText(); x += colQty;
                    cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText("Receita"); cs.endText();
                    yPosition -= (rowHeight + 4);
                    cs.setFont(PDType1Font.HELVETICA, 10);
                }

                x = margin;
                cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(String.valueOf(it.getProductId())); cs.endText(); x += colId;
                cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(it.getProductName()); cs.endText(); x += colName;
                cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(String.valueOf(it.getQuantitySold())); cs.endText(); x += colQty;
                cs.beginText(); cs.newLineAtOffset(x, yPosition); cs.showText(it.getRevenue().toString()); cs.endText();

                yPosition -= rowHeight;
            }

            cs.close();
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
