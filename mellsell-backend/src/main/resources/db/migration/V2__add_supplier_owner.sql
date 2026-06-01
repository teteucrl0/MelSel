ALTER TABLE suppliers ADD COLUMN owner_id BIGINT;
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_owner FOREIGN KEY (owner_id) REFERENCES users(id);
