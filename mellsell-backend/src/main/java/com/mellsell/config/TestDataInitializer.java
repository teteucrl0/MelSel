package com.mellsell.config;

import com.mellsell.catalog.entity.Product;
import com.mellsell.catalog.entity.Supplier;
import com.mellsell.catalog.repository.ProductRepository;
import com.mellsell.catalog.repository.SupplierRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Profile("h2")
public class TestDataInitializer implements CommandLineRunner {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    public TestDataInitializer(SupplierRepository supplierRepository, ProductRepository productRepository) {
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // create a sample supplier and product for quick testing in H2 profile
        if (supplierRepository.count() == 0) {
            Supplier s = Supplier.builder()
                    .name("Vendor Sample")
                    .email("vendor-sample@example.com")
                    .active(true)
                    .build();
            s = supplierRepository.save(s);

            Product p = Product.builder()
                    .name("Mel Puro 500g")
                    .description("Mel puro de alta qualidade")
                    .price(BigDecimal.valueOf(25.00))
                    .stock(100)
                    .lowStockThreshold(10)
                    .active(true)
                    .supplier(s)
                    .build();
            productRepository.save(p);
        }
    }
}
