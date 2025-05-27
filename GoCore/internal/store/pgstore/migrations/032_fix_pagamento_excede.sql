-- Write your migrate up statements here
/* ──────────────────────────────────────────────────────────
   substitui enforce_parcela_nao_ultrapassa()
   ──────────────────────────────────────────────────────────*/
CREATE OR REPLACE FUNCTION public.enforce_parcela_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago             numeric(10,2);
  v_parcelas_outras  numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* —— se é UPDATE mas valor_devido NÃO mudou, pula validação —— */
  IF TG_OP = 'UPDATE'
     AND NEW.valor_devido IS NOT DISTINCT FROM OLD.valor_devido THEN
        RETURN NEW;
  END IF;

  /* total do pedido */
  SELECT valor_total
       + COALESCE(taxa_entrega,0)
       + COALESCE(acrescimo,0)
       - COALESCE(desconto,0)
    INTO v_total
    FROM public.pedidos
   WHERE id = NEW.id_pedido;

  /* já pago (líquido) */
  SELECT COALESCE(SUM(valor_pago - troco),0)
    INTO v_pago
    FROM public.pedido_pagamentos
   WHERE id_pedido = NEW.id_pedido
     AND deleted_at IS NULL;

  /* demais parcelas (exclui a linha se for UPDATE) */
  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_parcelas_outras
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  v_restante := v_total - v_pago - v_parcelas_outras;

  IF NEW.valor_devido > v_restante THEN
     RAISE EXCEPTION
       '% excede o valor restante do pedido (%.2f)',
       format('Parcela %.2f', NEW.valor_devido),
       v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

/* recompila o gatilho (corpo mudou, nome manteve) */
DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;
CREATE TRIGGER trg_cr_chk_restante
BEFORE INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.enforce_parcela_nao_ultrapassa();

---- create above / drop below ----
/* remove o gatilho e volta à versão anterior (sempre validava) */
DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;

CREATE OR REPLACE FUNCTION public.enforce_parcela_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago             numeric(10,2);
  v_parcelas_outras  numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* versão antiga: valida sempre */
  SELECT valor_total
       + COALESCE(taxa_entrega,0)
       + COALESCE(acrescimo,0)
       - COALESCE(desconto,0)
    INTO v_total
    FROM public.pedidos
   WHERE id = NEW.id_pedido;

  SELECT COALESCE(SUM(valor_pago - troco),0)
    INTO v_pago
    FROM public.pedido_pagamentos
   WHERE id_pedido = NEW.id_pedido
     AND deleted_at IS NULL;

  SELECT COALESCE(SUM(valor_devido),0)
    INTO v_parcelas_outras
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  v_restante := v_total - v_pago - v_parcelas_outras;

  IF NEW.valor_devido > v_restante THEN
     RAISE EXCEPTION
       '% excede o valor restante do pedido (%.2f)',
       format('Parcela %.2f', NEW.valor_devido),
       v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cr_chk_restante
BEFORE INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.enforce_parcela_nao_ultrapassa();

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
