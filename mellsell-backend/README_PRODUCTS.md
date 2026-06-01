MEL-SELL — Produtos & Catálogo (versão 2)

VERSÃO 1 (Base):
- entity/Supplier.java
- entity/Product.java
- dto/CreateProductDTO.java
- dto/UpdateProductDTO.java
- dto/ProductResponseDTO.java
- repository/SupplierRepository.java
- repository/ProductRepository.java
- mapper/ProductMapper.java
- service/ProductService.java
- service/impl/ProductServiceImpl.java
- controller/ProductController.java
- exception/ResourceNotFoundException.java

VERSÃO 2 (Admin & Dashboard):
+ controller/AdminProductController.java
  Endpoints para gerenciar produtos com controle de acesso por role
  - POST /api/admin/products (ADMIN | VENDEDOR)
  - GET /api/admin/products/my (VENDEDOR)
  - GET /api/admin/products (ADMIN)
  - PUT /api/admin/products/{id} (ADMIN | VENDEDOR)
  - DELETE /api/admin/products/{id} (ADMIN | VENDEDOR)

+ ProductRepository - novos métodos de query
  - findBySupplierOwnerIdOrderByCreatedAtDesc(Long, Pageable)
  - searchBySupplierAndQuery(Long, String, Pageable)
  - searchByNameOrDescription(String, Pageable)
  - findBySupplierIdOrderByCreatedAtDesc(Long, Pageable)
  - findAllOrderByCreatedAtDesc(Pageable)

+ ProductService - novos métodos
  - listMyProducts(Pageable) - listar produtos do VENDEDOR autenticado
  - listAll(q, supplierId, Pageable) - listar todos para ADMIN

+ SupplierController - novo endpoint
  - GET /api/suppliers (ADMIN) - listar todos os fornecedores

SEGURANÇA:
- @PreAuthorize validando roles em todos endpoints
- checkVendorOwnership() garante VENDEDOR só acessa seus próprios produtos
- ADMIN pode gerenciar qualquer produto

OBSERVAÇÕES:
- Soft-delete (active = false) mantido
- Paginação e busca em todos endpoints
- Endpoints seguem padrão RESTful
- Integração com Spring Security e JWT

