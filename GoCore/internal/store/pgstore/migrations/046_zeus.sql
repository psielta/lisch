-- Write your migrate up statements here
CREATE OR REPLACE FUNCTION public.chk_apenas_um_is_main()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_tipo INTEGER;
  v_count INTEGER;
BEGIN
  -- Descobre se a categoria associada exige adicional principal único
  SELECT tipo_visualizacao
    INTO v_categoria_tipo
    FROM public.categorias
   WHERE id = NEW.id_categoria;

  IF v_categoria_tipo = 1 AND NEW.is_main THEN
    SELECT COUNT(*) INTO v_count
      FROM public.categoria_adicionais
     WHERE id_categoria = NEW.id_categoria
       AND is_main = TRUE
       AND deleted_at IS NULL
       AND (TG_OP = 'INSERT' OR id <> NEW.id);  -- se for update, exclui ele mesmo

    IF v_count > 0 THEN
      RAISE EXCEPTION 'Só pode haver um adicional principal (is_main = true) para essa categoria';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chk_um_is_main
BEFORE INSERT OR UPDATE ON public.categoria_adicionais
FOR EACH ROW
EXECUTE FUNCTION public.chk_apenas_um_is_main();

---- create above / drop below ----
-- migrate down
DROP TRIGGER IF EXISTS trg_chk_um_is_main ON public.categoria_adicionais;
DROP FUNCTION IF EXISTS public.chk_apenas_um_is_main;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
