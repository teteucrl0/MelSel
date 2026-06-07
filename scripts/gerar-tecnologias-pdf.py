#!/usr/bin/env python3
"""Gera PDF com as tecnologias do sistema MelSel."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = "/home/matheus/MelSel/MelSel-Tecnologias.pdf"

ACCENT = colors.HexColor("#D97706")
DARK = colors.HexColor("#1C1917")
MUTED = colors.HexColor("#57534E")
LIGHT_BG = colors.HexColor("#FFFBEB")


def section_title(text):
    return Paragraph(
        f'<font color="#D97706"><b>{text}</b></font>',
        ParagraphStyle("Section", fontSize=13, spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold"),
    )


def bullet_list(items):
    body = []
    for item in items:
        body.append(Paragraph(f"• {item}", styles["MelBullet"]))
    return body


styles = getSampleStyleSheet()
styles.add(ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=11, textColor=MUTED, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceAfter=4))
styles.add(ParagraphStyle("MelBullet", parent=styles["Body"], leftIndent=12, bulletIndent=0, spaceAfter=3))
styles.add(ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=MUTED, alignment=TA_CENTER))


def make_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths or [5.5 * cm, 11 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E7E5E4")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2 * cm,
    leftMargin=2 * cm,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
    title="MelSel — Tecnologias do Sistema",
    author="MelSel",
)

story = []

story.append(
    Paragraph(
        '<font size="22" color="#D97706"><b>MelSel</b></font>',
        ParagraphStyle("Title", alignment=TA_CENTER, spaceAfter=4),
    )
)
story.append(Paragraph("Tecnologias do Sistema", ParagraphStyle("H2", fontSize=16, alignment=TA_CENTER, textColor=DARK, spaceAfter=6)))
story.append(
    Paragraph(
        "Marketplace de mel artesanal — e-commerce com painel do apicultor, catálogo, carrinho, pedidos, avaliações e recursos em tempo real.",
        styles["Subtitle"],
    )
)
story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

# Arquitetura
story.append(section_title("Visão geral da arquitetura"))
story.append(
    make_table(
        [
            ["Camada", "Tecnologia"],
            ["Frontend (SPA)", "React + Vite"],
            ["Backend (API REST)", "Spring Boot"],
            ["Banco de dados", "MySQL (produção) ou H2 (dev / apresentação)"],
            ["Autenticação", "JWT (Bearer token)"],
            ["Tempo real", "WebSocket + STOMP + SockJS"],
            ["Build backend", "Maven"],
            ["Build frontend", "npm / Vite"],
        ]
    )
)
story.append(Spacer(1, 8))
story.append(
    Paragraph(
        "O frontend consome a API em <b>/api</b>. Em desenvolvimento, o proxy do Vite encaminha <b>/api</b>, <b>/uploads</b> e <b>/ws</b> para o backend (porta 8080), evitando problemas de CORS.",
        styles["Body"],
    )
)

# Backend
story.append(section_title("Backend (mellsell-backend)"))
story += bullet_list(
    [
        "<b>Java 21</b> e <b>Spring Boot 3.1.12</b>",
        "<b>Spring Web</b> — API REST com controllers JSON",
        "<b>Spring Data JPA</b> + <b>Hibernate</b> — persistência e ORM",
        "<b>Spring Security</b> — rotas protegidas e papéis (CLIENTE, VENDEDOR, ADMIN)",
        "<b>Bean Validation</b> (Jakarta) — validação de DTOs",
        "<b>JJWT 0.11.5</b> — tokens JWT (login em /api/auth/*)",
        "<b>Spring WebSocket</b> — STOMP sobre SockJS em /ws",
        "<b>Flyway 9.22</b> — migrações SQL versionadas",
        "<b>MySQL 8</b> (produção) e <b>H2</b> (dev / apresentação)",
        "<b>Lombok</b> — redução de boilerplate",
        "<b>Apache PDFBox 2.0</b> — relatórios em PDF no admin",
        "<b>Maven</b> — build e empacotamento JAR",
    ]
)
story.append(Spacer(1, 6))
story.append(Paragraph("<b>Módulos principais:</b> auth, catalog, cart, order, review, payment, address, realtime, config.", styles["Body"]))

# Frontend
story.append(section_title("Frontend (mellsell-frontend)"))
story += bullet_list(
    [
        "<b>React 19</b> + <b>React DOM 19</b> — interface em JavaScript (ES modules)",
        "<b>React Router DOM 7</b> — rotas públicas e privadas",
        "<b>Vite 8</b> — dev server, HMR e build de produção",
        "<b>Tailwind CSS 4</b> — estilos utilitários (@tailwindcss/vite)",
        "<b>Framer Motion 12</b> — animações de página e componentes",
        "<b>Axios</b> — HTTP com interceptor de JWT",
        "<b>@stomp/stompjs 7</b> + <b>sockjs-client</b> — tempo real (estoque, apiário, notificações)",
        "<b>Lottie React</b> — animações vetoriais",
        "<b>Vitest</b> + Testing Library — testes automatizados",
        "<b>ESLint 10</b> — qualidade de código",
        "Fonte <b>Inter</b> (Google Fonts); tema claro/escuro",
    ]
)

# Infra
story.append(section_title("Infraestrutura e desenvolvimento"))
story.append(
    make_table(
        [
            ["Ferramenta", "Uso"],
            ["Git", "Controle de versão"],
            ["Docker / Podman", "MySQL 8 via docker-compose.mysql.yml"],
            ["bash", "Scripts de execução (run-presentation.sh, run-mysql.sh, etc.)"],
            ["Vite proxy", "Dev: porta 5173 → API 8080"],
        ],
        col_widths=[5 * cm, 11.5 * cm],
    )
)
story.append(Spacer(1, 8))
story.append(
    make_table(
        [
            ["Perfil Spring", "Banco", "Uso"],
            ["h2", "H2 em memória", "Testes rápidos"],
            ["presentation", "H2 em arquivo", "Demo com dados persistentes"],
            ["(default)", "MySQL + Flyway", "Ambiente próximo de produção"],
        ],
        col_widths=[4 * cm, 4.5 * cm, 8 * cm],
    )
)

# Portas
story.append(section_title("Portas e comunicação"))
story += bullet_list(
    [
        "Frontend: <b>5173</b> (Vite)",
        "Backend: <b>8080</b> (Spring Boot)",
        "MySQL: <b>3306</b> (container)",
        "REST + STOMP: catálogo, carrinho, checkout, rastreamento simulado de entregas",
    ]
)

# Resumo
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E7E5E4")))
story.append(Spacer(1, 8))
story.append(
    Paragraph(
        "<b>Resumo:</b> MelSel = <b>React (Vite + Tailwind + Framer Motion)</b> no front "
        "+ <b>Spring Boot (JPA, Security, JWT, WebSocket, Flyway)</b> no back, "
        "com <b>H2/MySQL</b> e comunicação <b>REST + STOMP</b> em tempo real.",
        ParagraphStyle("Summary", parent=styles["Body"], fontSize=10, backColor=LIGHT_BG, borderPadding=8, spaceBefore=4),
    )
)
story.append(Spacer(1, 16))
story.append(Paragraph("Documento gerado em junho de 2026 — projeto MelSel", styles["Small"]))

doc.build(story)
print(f"PDF criado: {OUTPUT}")