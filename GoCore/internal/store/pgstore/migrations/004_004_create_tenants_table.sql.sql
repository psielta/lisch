-- Write your migrate up statements here

CREATE TABLE IF NOT EXISTS tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  plan        TEXT        NOT NULL,       -- ex: free, basic, premium
  status      TEXT        NOT NULL,       -- ex: active, suspended
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

---- create above / drop below ----

DROP TABLE IF EXISTS tenants;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete a linha separadora acima.
