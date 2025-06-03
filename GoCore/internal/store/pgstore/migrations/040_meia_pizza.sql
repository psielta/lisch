-- Write your migrate up statements here
/* =========================================================
   MIGRATION UP  –  Regras de meia-pizza
   ========================================================= */

-- 1) ── Função auxiliar: obtém o preço (promo ou base) de um produto na opção/tamanho
CREATE OR REPLACE FUNCTION public.preco_para_produto_opcao(
    p_produto uuid,
    p_opcao   uuid
) RETURNS numeric(10,2) LANGUAGE sql STRICT AS $$
    SELECT COALESCE(pp.preco_promocional, pp.preco_base)
      FROM public.produto_precos pp
     WHERE pp.id_produto         = p_produto
       AND pp.id_categoria_opcao = p_opcao
       AND pp.deleted_at IS NULL
     LIMIT 1;
$$;

-- 2) ── Trigger function: valida e calcula valor_unitario
CREATE OR REPLACE FUNCTION public.chk_calcular_meia_pizza()
RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
    v_opcao_meia char(1);
    v_preco1     numeric(10,2);
    v_preco2     numeric(10,2);
    v_cat_prod2  uuid;
BEGIN
    /* ── Descobre a política da categoria ── */
    SELECT c.opcao_meia
      INTO v_opcao_meia
      FROM public.categorias c
     WHERE c.id = NEW.id_categoria;

    /* ── Validações quando há segunda metade ── */
    IF NEW.id_produto_2 IS NOT NULL THEN
        -- Categoria precisa permitir; trata NULL como “não permitido”
        IF COALESCE(v_opcao_meia, '') = '' THEN
            RAISE EXCEPTION 'Categoria não permite meia pizza' USING ERRCODE='P0001';
        END IF;

        -- Ambas as metades devem pertencer à mesma categoria
        SELECT id_categoria INTO v_cat_prod2
          FROM public.produtos
         WHERE id = NEW.id_produto_2;

        IF v_cat_prod2 IS DISTINCT FROM NEW.id_categoria THEN
            RAISE EXCEPTION 'As duas metades devem ser da mesma categoria' USING ERRCODE='P0001';
        END IF;

        -- Não pode repetir a mesma metade
        IF NEW.id_produto_2 = NEW.id_produto THEN
            RAISE EXCEPTION 'As duas metades não podem ser o mesmo produto' USING ERRCODE='P0001';
        END IF;
    END IF;

    /* ── Cálculo de preços ── */
    v_preco1 := public.preco_para_produto_opcao(
                    NEW.id_produto, NEW.id_categoria_opcao);

    IF v_preco1 IS NULL THEN
        RAISE EXCEPTION 'Preço não encontrado para a primeira metade' USING ERRCODE='P0001';
    END IF;

    IF NEW.id_produto_2 IS NOT NULL THEN
        v_preco2 := public.preco_para_produto_opcao(
                        NEW.id_produto_2, NEW.id_categoria_opcao);

        IF v_preco2 IS NULL THEN
            RAISE EXCEPTION 'Preço não encontrado para a segunda metade' USING ERRCODE='P0001';
        END IF;

        /*  Políticas:
            'M' → média; qualquer outro valor (inclusive NULL) = maior valor  */
        IF COALESCE(v_opcao_meia, 'V') = 'M' THEN
            NEW.valor_unitario := ROUND((v_preco1 + v_preco2)/2, 2);
        ELSE
            NEW.valor_unitario := GREATEST(v_preco1, v_preco2);
        END IF;
    ELSE
        NEW.valor_unitario := v_preco1;
    END IF;

    RETURN NEW;
END;
$$;

-- 3) ── Trigger que chama a função acima
DROP TRIGGER IF EXISTS trg_pi_meia_pizza ON public.pedido_itens;

CREATE TRIGGER trg_pi_meia_pizza
BEFORE INSERT OR UPDATE OF id_produto, id_produto_2, id_categoria_opcao
ON public.pedido_itens
FOR EACH ROW
EXECUTE FUNCTION public.chk_calcular_meia_pizza();
---- create above / drop below ----
/* =========================================================
   MIGRATION DOWN  –  Remove regras de meia-pizza
   ========================================================= */

-- Remove trigger
DROP TRIGGER IF EXISTS trg_pi_meia_pizza ON public.pedido_itens;

-- Remove trigger-function
DROP FUNCTION IF EXISTS public.chk_calcular_meia_pizza();

-- Remove função auxiliar
DROP FUNCTION IF EXISTS public.preco_para_produto_opcao(uuid, uuid);
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
