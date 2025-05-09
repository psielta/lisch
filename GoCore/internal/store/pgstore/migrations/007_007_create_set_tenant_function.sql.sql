-- Write your migrate up statements here

-- helper para a sua aplicação/internals chamar
CREATE OR REPLACE FUNCTION set_tenant(v_id TEXT) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', v_id, FALSE);
END;
$$ LANGUAGE plpgsql;

---- create above / drop below ----

DROP FUNCTION IF EXISTS set_tenant(TEXT);
-- Write your migrate down statements here.
