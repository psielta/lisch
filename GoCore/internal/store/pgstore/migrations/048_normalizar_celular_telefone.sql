-- Write your migrate up statements here
-- 1) Função que remove tudo que não seja dígito
CREATE OR REPLACE FUNCTION public.clientes_normaliza_fones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  /* --- TELEFONE --- */
  IF NEW.telefone IS NOT NULL AND NEW.telefone <> '' THEN
     NEW.telefone := regexp_replace(NEW.telefone, '\D', '', 'g');
     -- Se depois da limpeza não sobrar nada, grava NULL
     IF NEW.telefone = '' THEN
        NEW.telefone := NULL;
     END IF;
  END IF;

  /* --- CELULAR --- */
  IF NEW.celular IS NOT NULL AND NEW.celular <> '' THEN
     NEW.celular := regexp_replace(NEW.celular, '\D', '', 'g');
     IF NEW.celular = '' THEN
        NEW.celular := NULL;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Gatilho que chama a função
DROP TRIGGER IF EXISTS trg_normaliza_fones ON public.clientes;

CREATE TRIGGER trg_normaliza_fones
BEFORE INSERT OR UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.clientes_normaliza_fones();
---- create above / drop below ----

DROP TRIGGER IF EXISTS trg_normaliza_fones ON public.clientes;
DROP FUNCTION IF EXISTS public.clientes_normaliza_fones();
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
