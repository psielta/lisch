-- Write your migrate up statements here
/* ═════════ 1. FUNÇÃO de validação ═════════ */
CREATE OR REPLACE FUNCTION public.enforce_parcela_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago             numeric(10,2);
  v_parcelas_outras  numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* total do pedido (itens + entrega + acréscimo – desconto) */
  SELECT valor_total
       + COALESCE(taxa_entrega,0)
       + COALESCE(acrescimo,0)
       - COALESCE(desconto,0)
    INTO v_total
    FROM public.pedidos
   WHERE id = NEW.id_pedido;

  /* soma já paga (líquida) */
  SELECT COALESCE(SUM(valor_pago - troco),0)
    INTO v_pago
    FROM public.pedido_pagamentos
   WHERE id_pedido = NEW.id_pedido
     AND deleted_at IS NULL;

  /* soma das demais parcelas (exclui a própria linha se UPDATE) */
  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_parcelas_outras
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  v_restante := v_total - v_pago - v_parcelas_outras;

  IF NEW.valor_devido > v_restante THEN
     RAISE EXCEPTION
       'Parcela (%.2f) excede o valor restante do pedido (%.2f)',
       NEW.valor_devido, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

/* ═════════ 2. Gatilho na tabela contas_receber ═════════ */
DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;

CREATE TRIGGER trg_cr_chk_restante
BEFORE INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.enforce_parcela_nao_ultrapassa();

---- create above / drop below ----
/* remove gatilho e função */
DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;
DROP FUNCTION IF EXISTS public.enforce_parcela_nao_ultrapassa();

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
