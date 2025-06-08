-- Write your migrate up statements here
 -- object recreation
DROP FUNCTION public.calcular_valores_esperados_caixa(p_caixa_id uuid);

CREATE FUNCTION public.calcular_valores_esperados_caixa (
  p_caixa_id uuid
)
RETURNS TABLE (
  id_forma_pagamento smallint,
  codigo_forma varchar,
  nome_forma varchar,
  valor_esperado numeric
) LANGUAGE 'plpgsql'
STABLE
CALLED ON NULL INPUT
SECURITY INVOKER
PARALLEL UNSAFE
COST 100 ROWS 1000
AS
$body$
BEGIN
    RETURN QUERY
    SELECT fp.id, fp.codigo, fp.nome,
           public.calcular_valor_esperado_forma(p_caixa_id, fp.id)
      FROM public.formas_pagamento fp
     WHERE fp.ativo = 1
     ORDER BY fp.ordem, fp.nome;
END;
$body$;
---- create above / drop below ----
CREATE OR REPLACE FUNCTION public.calcular_valores_esperados_caixa(p_caixa_id uuid)
RETURNS TABLE(id_forma_pagamento smallint, codigo_forma text, nome_forma text, valor_esperado numeric(10,2))
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT fp.id, fp.codigo, fp.nome,
           public.calcular_valor_esperado_forma(p_caixa_id, fp.id)
      FROM public.formas_pagamento fp
     WHERE fp.ativo = 1
     ORDER BY fp.ordem, fp.nome;
END;
$$;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
