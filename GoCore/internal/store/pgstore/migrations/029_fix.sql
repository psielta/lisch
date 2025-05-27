-- Write your migrate up statements here
/* ──────────────────────────────────────────────────────────────
   1. função recalcular_pagamentos  –  inclui parcelas no cálculo
   ──────────────────────────────────────────────────────────────*/
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total         numeric(10,2);
    v_valor_pago    numeric(10,2);
    v_valor_parc    numeric(10,2);
    v_finalizado    boolean;
BEGIN
    /* total = itens + entrega + acréscimo − desconto */
    SELECT valor_total
         + COALESCE(taxa_entrega,0)
         + COALESCE(acrescimo,0)
         - COALESCE(desconto,0)
      INTO v_total
      FROM public.pedidos
     WHERE id = p_pedido_id;

    /* soma já paga (líquida) */
    SELECT COALESCE(SUM(valor_pago - troco),0)
      INTO v_valor_pago
      FROM public.pedido_pagamentos
     WHERE id_pedido = p_pedido_id
       AND deleted_at IS NULL;

    /* soma das parcelas previstas */
    SELECT COALESCE(SUM(valor_devido),0)
      INTO v_valor_parc
      FROM public.contas_receber
     WHERE id_pedido = p_pedido_id;

    /* regra: finalizado se tudo já pago OU
              toda a diferença está agendada em parcelas      */
    v_finalizado := (v_valor_pago + v_valor_parc) >= v_total;

    UPDATE public.pedidos
       SET valor_pago = v_valor_pago,
           quitado    = (v_valor_pago >= v_total),
           finalizado = v_finalizado,
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

/* ──────────────────────────────────────────────────────────────
   2. gatilho enforce_pagamento_nao_ultrapassa – considera parcelas
   ──────────────────────────────────────────────────────────────*/
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_valor_parc       numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* total do pedido */
  SELECT valor_total
       + COALESCE(taxa_entrega,0)
       + COALESCE(acrescimo,0)
       - COALESCE(desconto,0)
    INTO v_total
    FROM public.pedidos
   WHERE id = NEW.id_pedido;

  /* soma já paga (exceto a própria linha em UPDATE) */
  SELECT COALESCE(SUM(valor_pago - troco),0)
    INTO v_pago_anteriores
    FROM public.pedido_pagamentos
   WHERE id_pedido = NEW.id_pedido
     AND deleted_at IS NULL
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  /* soma das parcelas já geradas */
  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_valor_parc
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido;

  /* quanto ainda falta cobrir */
  v_restante := v_total - v_pago_anteriores - v_valor_parc;

  IF (NEW.valor_pago - NEW.troco) > v_restante THEN
     RAISE EXCEPTION
       'Pagamento (%.2f) excede o restante do pedido (%.2f)',
       NEW.valor_pago - NEW.troco, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

/* o corpo da função mudou, mas não é preciso recriar o trigger;
   ele já aponta para este nome.  Se preferir forçar recompilação: */
DROP TRIGGER IF EXISTS trg_pp_chk_restante ON public.pedido_pagamentos;
CREATE TRIGGER trg_pp_chk_restante
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pagamento_nao_ultrapassa();

/* ──────────────────────────────────────────────────────────────
   3.  recalcular todos os pedidos existentes
   ──────────────────────────────────────────────────────────────*/
UPDATE public.pedidos SET updated_at = now();  -- dispara gatilhos

---- create above / drop below ----
/* 1 ── restaurar versão antiga de enforce_pagamento_nao_ultrapassa */
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  SELECT valor_total
       + COALESCE(taxa_entrega,0)
       + COALESCE(acrescimo,0)
       - COALESCE(desconto,0)
    INTO v_total
    FROM public.pedidos
   WHERE id = NEW.id_pedido;

  SELECT COALESCE(SUM(valor_pago - troco),0)
    INTO v_pago_anteriores
    FROM public.pedido_pagamentos
   WHERE id_pedido = NEW.id_pedido
     AND deleted_at IS NULL
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  v_restante := v_total - v_pago_anteriores;

  IF (NEW.valor_pago - NEW.troco) > v_restante THEN
     RAISE EXCEPTION
       'Pagamento (%.2f) excede o restante do pedido (%.2f)',
       NEW.valor_pago - NEW.troco, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

/* recompila trigger */
DROP TRIGGER IF EXISTS trg_pp_chk_restante ON public.pedido_pagamentos;
CREATE TRIGGER trg_pp_chk_restante
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pagamento_nao_ultrapassa();

/* 2 ── restaurar função recalcular_pagamentos (sem soma das parcelas) */
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
           finalizado = ((v_valor_pago >= v_total) OR EXISTS (
                            SELECT 1 FROM public.contas_receber
                             WHERE id_pedido = p_pedido_id
                          )),
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

/* 3 ── recalculação forçada */
UPDATE public.pedidos SET updated_at = now();

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
