package com.mellsell.config;

import com.mellsell.auth.entity.Role;
import com.mellsell.auth.entity.User;
import com.mellsell.auth.repository.UserRepository;
import com.mellsell.catalog.repository.SupplierRepository;
import com.mellsell.catalog.service.SupplierProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

/** Garante loja (supplier) para apicultores após migração MySQL. */
@Component
@Profile("mysql")
@RequiredArgsConstructor
@Slf4j
public class VendorSupplierRepairRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierProvisioningService supplierProvisioningService;

    @Override
    public void run(String... args) {
        List<User> vendors = userRepository.findByRole(Role.VENDEDOR);
        for (User vendor : vendors) {
            if (supplierRepository.findByOwnerId(vendor.getId()).isEmpty()) {
                supplierProvisioningService.getOrCreateForVendor(vendor);
                log.info("Loja do apicultor provisionada: {}", vendor.getEmail());
            }
        }
    }
}