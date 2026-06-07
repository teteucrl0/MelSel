package com.mellsell.catalog.repository;

import com.mellsell.catalog.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /** GET /api/products?q= — name, description e supplierName (p.supplier.name). */
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true AND p.supplier.active = true
            AND (
              LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchActiveByNameOrDescription(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.supplier.id = :supplierId AND p.supplier.active = true ORDER BY p.createdAt DESC")
    Page<Product> findBySupplierIdAndActive(@Param("supplierId") Long supplierId, Pageable pageable);

    /** GET /api/products?q=&supplierId= — mesmos campos de busca que searchActiveByNameOrDescription. */
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true AND p.supplier.id = :supplierId AND p.supplier.active = true
            AND (
              LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchActiveBySupplierAndQuery(@Param("supplierId") Long supplierId, @Param("q") String q, Pageable pageable);

    Page<Product> findByActiveTrueAndSupplierActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.supplier.owner.id = :ownerId ORDER BY p.createdAt DESC")
    Page<Product> findBySupplierOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.supplier.id = :supplierId
            AND (
              LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchBySupplierAndQuery(@Param("supplierId") Long supplierId, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE (
              LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchByNameOrDescription(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.supplier.id = :supplierId ORDER BY p.createdAt DESC")
    Page<Product> findBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") Long supplierId, Pageable pageable);

    @Query("SELECT p FROM Product p ORDER BY p.createdAt DESC")
    Page<Product> findAllOrderByCreatedAtDesc(Pageable pageable);
}
