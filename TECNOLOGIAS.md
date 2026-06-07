# MelSel — Tecnologias do sistema

Marketplace de mel artesanal (e-commerce) com painel do apicultor, catálogo público, carrinho, pedidos, avaliações e recursos em tempo real.

---

## Visão geral da arquitetura

| Camada | Tecnologia |
|--------|------------|
| Frontend (SPA) | React + Vite |
| Backend (API REST) | Spring Boot |
| Banco de dados | MySQL (produção) ou H2 (dev / apresentação) |
| Autenticação | JWT (Bearer token) |
| Tempo real | WebSocket + STOMP + SockJS |
| Build backend | Maven |
| Build frontend | npm / Vite |

Comunicação: o frontend consome a API em `/api` e, em desenvolvimento, usa o **proxy do Vite** para evitar CORS (incluindo acesso pela rede local).

---

## Backend (`mellsell-backend`)

### Linguagem e runtime
- **Java 21**
- **Spring Boot 3.1.12**

### Frameworks e módulos Spring
- **Spring Web** — API REST (controllers JSON)
- **Spring Data JPA** — persistência e repositórios
- **Hibernate** — ORM (via JPA)
- **Spring Security** — proteção de rotas e papéis (`CLIENTE`, `VENDEDOR`, `ADMIN`)
- **Bean Validation** (`jakarta.validation`) — validação de DTOs
- **Spring WebSocket** — mensageria em tempo real (STOMP)

### Segurança e autenticação
- **JJWT 0.11.5** — geração e validação de tokens JWT
- Login/registro em `/api/auth/*`
- Nome de exibição no token (`displayName`) para o header da loja

### Banco de dados e migrações
- **MySQL 8** — perfil padrão (`application.properties`) + driver `mysql-connector-java`
- **H2** — perfis de desenvolvimento e demonstração:
  - `h2` — memória (`application-h2.properties`)
  - `presentation` — arquivo persistente em `data/presentation/` (`application-presentation.properties`)
- **Flyway 9.22** — scripts SQL versionados em `src/main/resources/db/migration/` (ex.: `V1__`, `V6__`, `V7__`)

### Tempo real
- **STOMP** sobre **SockJS** (`/ws`)
- Tópicos para: apiário ao vivo, estoque, notificações do vendedor
- Configuração em `WebSocketConfig.java` e serviços em `realtime/`

### Outras bibliotecas
- **Lombok** — redução de boilerplate (getters, builders)
- **Apache PDFBox 2.0** — relatórios/admin em PDF
- **Maven** — dependências, compilação e empacotamento JAR

### Funcionalidades principais (módulos)
- `auth` — usuários, JWT, registro (cliente e apicultor)
- `catalog` — produtos, fornecedores, cupons, upload de imagens
- `cart` — carrinho e reserva de estoque
- `order` — checkout, pedidos, **rastreamento simulado** (estilo Correios)
- `review` — avaliações com moderação
- `payment` — pagamento simulado (ambiente de teste)
- `config` — exceções globais, CORS, WebMvc (uploads estáticos)

---

## Frontend (`mellsell-frontend`)

### Linguagem e runtime
- **JavaScript (ES modules)**
- **Node.js** — ferramentas de build e `npm`

### UI e roteamento
- **React 19**
- **React DOM 19**
- **React Router DOM 7** — rotas públicas e privadas (`PrivateRoute`)
- **Tailwind CSS 4** — estilos utilitários (`@tailwindcss/vite`)
- **Framer Motion 12** — animações de página, listas e alertas
- Fonte **Inter** (Google Fonts)

### HTTP e API
- **Axios** — cliente HTTP com interceptor de JWT
- Base da API configurável (`VITE_API_URL`); em dev usa proxy do Vite

### Tempo real (cliente)
- **@stomp/stompjs 7** — cliente STOMP
- **sockjs-client 1.6** — transporte WebSocket (carregamento sob demanda nos hooks)
- Hooks: `useStompTopic`, `useStockSync`, feeds ao vivo (`LiveApiaryFeed`, `ApiarySetupLive`, `VendorNotificationStack`)

### Build e qualidade
- **Vite 8** — dev server, HMR e build de produção
- **@vitejs/plugin-react 6** — JSX/React
- **ESLint 10** — lint do código

### Componentes e páginas (exemplos)
- Catálogo, detalhe do produto, carrinho, checkout
- Pedidos e **rastreamento de entrega**
- Painel do apicultor, estoque, cupons, promoções
- Admin: dashboard, produtos, usuários, relatórios
- **ProductEditModal** — edição de produto em modal
- **ThemeToggle** — modo claro/escuro
- **ErrorBoundary** — falhas de renderização sem tela totalmente branca

---

## Infraestrutura de desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| **Git** | controle de versão |
| **bash** | scripts (`run-presentation.sh`, etc.) |
| **Fedora / Linux** | ambiente de desenvolvimento do projeto |
| **Vite proxy** | `/api`, `/uploads`, `/ws` → `localhost:8080` |

### Portas padrão
- Frontend: **5173** (Vite)
- Backend: **8080** (Spring Boot)
- H2 Console (perfis H2): **/h2-console**

---

## Perfis Spring e quando usar

| Perfil | Banco | Uso |
|--------|-------|-----|
| `h2` | H2 em memória | testes rápidos, some ao reiniciar |
| `presentation` | H2 em arquivo | demo na faculdade, dados persistem |
| (default) | MySQL + Flyway | ambiente mais próximo de produção |

---

## Rastreamento de pedidos

- Implementação **simulada** no backend (`ShipmentTrackingService`), sem API paga dos Correios
- Código de rastreio no padrão brasileiro (ex.: `ME000000001BR`)
- Timeline por tempo desde a confirmação do pedido
- Fallback no frontend se o endpoint `/api/orders/{id}/tracking` não estiver disponível

---

## Resumo em uma linha

**MelSel** = **React (Vite + Tailwind + Framer Motion)** no front + **Spring Boot (JPA, Security, JWT, WebSocket, Flyway)** no back, com **H2/MySQL** e comunicação **REST + STOMP** em tempo real.