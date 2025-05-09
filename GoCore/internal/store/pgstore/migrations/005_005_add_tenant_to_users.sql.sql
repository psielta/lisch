-- ============ UP ============

-- 1) adiciona coluna e FK
ALTER TABLE users
  ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);

-- 2) índice para acelerar queries por tenant
CREATE INDEX IF NOT EXISTS users_tenant_id_idx
  ON users(tenant_id);

---- create above / drop below ----

-- ============ DOWN ==========

-- 1) drop FK e coluna
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;

-- 2) drop índice
DROP INDEX IF EXISTS users_tenant_id_idx;
