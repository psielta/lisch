-- ============ UP ============

-- 1) adiciona coluna e FK
ALTER TABLE products
  ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);

-- 2) índice para acelerar queries por tenant
CREATE INDEX IF NOT EXISTS products_tenant_id_idx
  ON products(tenant_id);

---- create above / drop below ----

-- ============ DOWN ==========

-- 1) drop FK e coluna
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;
ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;

-- 2) drop índice
DROP INDEX IF EXISTS products_tenant_id_idx;
