package com.mellsell.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * No perfil presentation o Flyway está desligado; garante colunas novas no H2 em arquivo.
 */
@Slf4j
@Component
@Profile("presentation")
@RequiredArgsConstructor
public class PresentationSchemaPatch implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureColumn("users", "birth_date", "DATE");
        ensureColumn("users", "avatar_url", "VARCHAR(512)");
        ensureColumn("orders", "supplier_id", "BIGINT");
        ensureColumn("orders", "supplier_name", "VARCHAR(120)");
        ensureColumn("order_items", "supplier_id", "BIGINT");
        ensureColumn("order_items", "supplier_name", "VARCHAR(120)");
        ensureTrackingStepsColumn();
    }

    private void ensureColumn(String table, String column, String sqlType) {
        if (columnExists(table.toUpperCase(), column.toUpperCase())) {
            return;
        }
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + sqlType);
            log.info("Coluna {}.{} criada (modo apresentação).", table, column);
        } catch (Exception ex) {
            log.warn("Não foi possível adicionar {}.{}: {}", table, column, ex.getMessage());
        }
    }

    private void ensureTrackingStepsColumn() {
        if (columnExists("ORDERS", "TRACKING_STEPS_COMPLETED")) {
            jdbcTemplate.update("UPDATE orders SET tracking_steps_completed = 0 WHERE tracking_steps_completed IS NULL");
            return;
        }
        try {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN tracking_steps_completed INTEGER DEFAULT 0");
            jdbcTemplate.update("UPDATE orders SET tracking_steps_completed = 0 WHERE tracking_steps_completed IS NULL");
            log.info("Coluna orders.tracking_steps_completed criada (modo apresentação).");
        } catch (Exception ex) {
            log.warn("Não foi possível adicionar orders.tracking_steps_completed: {}", ex.getMessage());
        }
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE UPPER(TABLE_NAME) = ? AND UPPER(COLUMN_NAME) = ?",
                Integer.class,
                table.toUpperCase(),
                column.toUpperCase());
        return count != null && count > 0;
    }
}