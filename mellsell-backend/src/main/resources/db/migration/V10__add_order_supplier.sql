ALTER TABLE orders ADD COLUMN supplier_id BIGINT;
ALTER TABLE orders ADD COLUMN supplier_name VARCHAR(120);
ALTER TABLE order_items ADD COLUMN supplier_id BIGINT;
ALTER TABLE order_items ADD COLUMN supplier_name VARCHAR(120);