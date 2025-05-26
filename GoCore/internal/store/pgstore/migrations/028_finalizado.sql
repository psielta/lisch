-- Write your migrate up statements here
/* 1 ─── nova coluna em pedidos */
ALTER TABLE public.pedidos
  ADD COLUMN finalizado boolean NOT NULL DEFAULT false;

/* 2 ─── função central de recálculo (substitui a atual) */
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total        numeric(10,2);
    v_valor_pago   numeric(10,2);
    v_tem_parcela  boolean;
    v_finalizado   boolean;
BEGIN
    /* total = itens + entrega + acréscimo – desconto */
    SELECT valor_total
         + COALESCE(taxa_entrega,0)
         + COALESCE(acrescimo,0)
         - COALESCE(desconto,0)
      INTO v_total
      FROM public.pedidos
     WHERE id = p_pedido_id;

    /* soma líquida dos pagamentos */
    SELECT COALESCE(SUM(valor_pago - troco),0)
      INTO v_valor_pago
      FROM public.pedido_pagamentos
     WHERE id_pedido = p_pedido_id
       AND deleted_at IS NULL;

    /* há alguma parcela gerada? */
    SELECT EXISTS (
            SELECT 1 FROM public.contas_receber
             WHERE id_pedido = p_pedido_id
          )
      INTO v_tem_parcela;

    /* regra de finalização */
    v_finalizado := (v_valor_pago >= v_total) OR v_tem_parcela;

    UPDATE public.pedidos
       SET valor_pago = v_valor_pago,
           quitado    = (v_valor_pago >= v_total),
           finalizado = v_finalizado,
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

/* 3 ─── trigger em contas_receber → recalcula pedido              */
/*     (pagamentos já têm o gatilho trg_pp_after_iu_d)             */
CREATE OR REPLACE FUNCTION public.trg_cr_recalc_pedido()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
     PERFORM public.recalcular_pagamentos(OLD.id_pedido);
  ELSE
     PERFORM public.recalcular_pagamentos(NEW.id_pedido);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cr_after_iu_d
AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.trg_cr_recalc_pedido();

/* 4 ─── atualiza registros existentes para refletir a regra nova */
UPDATE public.pedidos
   SET updated_at = now()
 WHERE true;         -- força disparo do trigger ON UPDATE

---- create above / drop below ----

-- xMIGRATE DOWN

/* 1 ─── remove trigger auxiliar */
DROP TRIGGER IF EXISTS trg_cr_after_iu_d ON public.contas_receber;
DROP FUNCTION IF EXISTS public.trg_cr_recalc_pedido();

/* 2 ─── recoloca a versão anterior da função (sem finalizado) */
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total      numeric(10,2);
    v_valor_pago numeric(10,2);
BEGIN
    SELECT valor_total
         + COALESCE(taxa_entrega,0)
         + COALESCE(acrescimo,0)
         - COALESCE(desconto,0)
      INTO v_total
      FROM public.pedidos
     WHERE id = p_pedido_id;

    SELECT COALESCE(SUM(valor_pago - troco),0)
      INTO v_valor_pago
      FROM public.pedido_pagamentos
     WHERE id_pedido = p_pedido_id
       AND deleted_at IS NULL;

    UPDATE public.pedidos
       SET valor_pago = v_valor_pago,
           quitado    = (v_valor_pago >= v_total),
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

/* 3 ─── apaga a coluna finalizado */
ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS finalizado;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
