-- Write your migrate up statements here
/* ════════════ atualiza a função de pagamento ════════════ */
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_valor_parc       numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* ➤ Se pagamento está ligado a parcela,
       quem valida é enforce_parcela_nao_ultrapassa */
  IF NEW.id_conta_receber IS NOT NULL THEN
     RETURN NEW;
  END IF;

  /* —— valida pagamento à vista —— */
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

  /* soma agendada em parcelas */
  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_valor_parc
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido;

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

/* recompila o trigger */
DROP TRIGGER IF EXISTS trg_pp_chk_restante ON public.pedido_pagamentos;
CREATE TRIGGER trg_pp_chk_restante
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pagamento_nao_ultrapassa();

---- create above / drop below ----
/* Restaura versão anterior (que sempre validava) */
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_valor_parc       numeric(10,2);
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

  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_valor_parc
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido;

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

DROP TRIGGER IF EXISTS trg_pp_chk_restante ON public.pedido_pagamentos;
CREATE TRIGGER trg_pp_chk_restante
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pagamento_nao_ultrapassa();

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
