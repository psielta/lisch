-- Write your migrate up statements here
-- Valores e quantidades sempre positivos
ALTER TABLE public.pedido_itens
  ADD CONSTRAINT chk_pi_quantidade_positiva     CHECK (quantidade  > 0),
  ADD CONSTRAINT chk_pi_valor_unitario_positivo CHECK (valor_unitario >= 0);

ALTER TABLE public.pedido_item_adicionais
  ADD CONSTRAINT chk_pia_quantidade_positiva CHECK (quantidade > 0),
  ADD CONSTRAINT chk_pia_valor_positivo      CHECK (valor      >= 0);

ALTER TABLE public.pedidos
  ADD CONSTRAINT chk_pedidos_valor_total_positivo  CHECK (valor_total  >= 0),
  ADD CONSTRAINT chk_pedidos_taxa_entrega_positiva CHECK (taxa_entrega >= 0);
CREATE OR REPLACE FUNCTION public.recalcular_total_pedido(p_pedido_id uuid)
RETURNS void LANGUAGE plpgsql AS
$$
DECLARE
    v_total numeric(10,2);
BEGIN
    /* Soma de adicionais por item (exclui soft-deletados) */
    WITH add_tot AS (
        SELECT id_pedido_item,
               SUM(valor * quantidade) AS total_add
        FROM   public.pedido_item_adicionais
        WHERE  deleted_at IS NULL
        GROUP  BY id_pedido_item
    )
    SELECT COALESCE(
           SUM( pi.valor_unitario * pi.quantidade
              + COALESCE(a.total_add, 0) ), 0)
      INTO v_total
      FROM public.pedido_itens pi
      LEFT JOIN add_tot a ON a.id_pedido_item = pi.id
      WHERE pi.id_pedido = p_pedido_id
        AND pi.deleted_at IS NULL;

    UPDATE public.pedidos
       SET valor_total = v_total,
           updated_at  = NOW()       -- mantém rastro temporal
     WHERE id = p_pedido_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.trg_pi_recalc_total()
RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
    PERFORM public.recalcular_total_pedido(
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id_pedido
             ELSE NEW.id_pedido END);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pi_after_iu_d
AFTER INSERT OR UPDATE OR DELETE ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.trg_pi_recalc_total();
CREATE OR REPLACE FUNCTION public.trg_pia_recalc_total()
RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
    v_pedido uuid;
BEGIN
    /* Descobre o pedido a partir do item ligado */
    SELECT id_pedido
      INTO v_pedido
      FROM public.pedido_itens
     WHERE id = COALESCE(NEW.id_pedido_item, OLD.id_pedido_item);

    IF v_pedido IS NOT NULL THEN
        PERFORM public.recalcular_total_pedido(v_pedido);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pia_after_iu_d
AFTER INSERT OR UPDATE OR DELETE ON public.pedido_item_adicionais
FOR EACH ROW EXECUTE FUNCTION public.trg_pia_recalc_total();

---- create above / drop below ----
-- 1. REMOVER TRIGGERS (precisa vir antes das funções que elas chamam)
DROP TRIGGER IF EXISTS trg_pi_after_iu_d          ON public.pedido_itens;
DROP TRIGGER IF EXISTS trg_pia_after_iu_d         ON public.pedido_item_adicionais;

-- 2. REMOVER FUNÇÕES DOS TRIGGERS E A FUNÇÃO CENTRAL
DROP FUNCTION IF EXISTS public.trg_pi_recalc_total();
DROP FUNCTION IF EXISTS public.trg_pia_recalc_total();
DROP FUNCTION IF EXISTS public.recalcular_total_pedido(uuid);

-- 3. REMOVER CHECK CONSTRAINTS

-- pedido_itens
ALTER TABLE public.pedido_itens
  DROP CONSTRAINT IF EXISTS chk_pi_quantidade_positiva,
  DROP CONSTRAINT IF EXISTS chk_pi_valor_unitario_positivo;

-- pedido_item_adicionais
ALTER TABLE public.pedido_item_adicionais
  DROP CONSTRAINT IF EXISTS chk_pia_quantidade_positiva,
  DROP CONSTRAINT IF EXISTS chk_pia_valor_positivo;

-- pedidos
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS chk_pedidos_valor_total_positivo,
  DROP CONSTRAINT IF EXISTS chk_pedidos_taxa_entrega_positiva;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
