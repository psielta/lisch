-- Write your migrate up statements here
/* ═════ 1. função central de recálculo do pedido ═════ */
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total             numeric(10,2);
    v_valor_pago        numeric(10,2);
    v_saldo_parcelas    numeric(10,2);
    v_finalizado        boolean;
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

    /* agora usa SALDO (devido - pago) das parcelas */
    SELECT COALESCE(SUM(valor_devido - valor_pago),0)
      INTO v_saldo_parcelas
      FROM public.contas_receber
     WHERE id_pedido = p_pedido_id;

    v_finalizado := (v_valor_pago + (v_total - v_valor_pago - v_saldo_parcelas) = v_total)
                    OR (v_saldo_parcelas > 0);

    UPDATE public.pedidos
       SET valor_pago = v_valor_pago,
           quitado    = (v_valor_pago >= v_total),
           finalizado = (v_valor_pago >= v_total) OR (v_saldo_parcelas > 0),
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

/* ═════ 2. paga-à-vista: gatilho de pagamento ═════ */
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_saldo_parcelas   numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* pagamentos que ABATEM parcela são ignorados aqui */
  IF NEW.id_conta_receber IS NOT NULL THEN
     RETURN NEW;
  END IF;

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

  /* saldo ainda NÃO pago das parcelas */
  SELECT COALESCE(SUM(valor_devido - valor_pago),0)
    INTO v_saldo_parcelas
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido;

  v_restante := v_total - v_pago_anteriores - v_saldo_parcelas;

  IF (NEW.valor_pago - NEW.troco) > v_restante THEN
     RAISE EXCEPTION
       'Pagamento %.2f excede o restante do pedido (%.2f)',
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

/* ═════ 3. parcelamento: gatilho de parcela ═════ */
CREATE OR REPLACE FUNCTION public.enforce_parcela_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago             numeric(10,2);
  v_saldo_outros     numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* Se UPDATE e valor_devido não mudou -> ignora */
  IF TG_OP = 'UPDATE'
     AND NEW.valor_devido IS NOT DISTINCT FROM OLD.valor_devido THEN
        RETURN NEW;
  END IF;

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

  /* saldo das demais parcelas */
  SELECT COALESCE(SUM(valor_devido - valor_pago),0)
    INTO v_saldo_outros
    FROM public.contas_receber
   WHERE id_pedido = NEW.id_pedido
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  v_restante := v_total - v_pago - v_saldo_outros;

  IF NEW.valor_devido > v_restante THEN
     RAISE EXCEPTION
       'Parcela %.2f excede o restante do pedido (%.2f)',
       NEW.valor_devido, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;
CREATE TRIGGER trg_cr_chk_restante
BEFORE INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.enforce_parcela_nao_ultrapassa();

/* ═════ 4. força recálculo em todos os pedidos ═════ */
UPDATE public.pedidos SET updated_at = now();

---- create above / drop below ----
/* ============================================================
   1. Remova os gatilhos criados/recompilados na 033
   ============================================================ */
DROP TRIGGER IF EXISTS trg_pp_chk_restante ON public.pedido_pagamentos;
DROP TRIGGER IF EXISTS trg_cr_chk_restante ON public.contas_receber;

/* ============================================================
   2. Exclua as funções introduzidas / substituídas na 033
   ============================================================ */
DROP FUNCTION IF EXISTS public.enforce_pagamento_nao_ultrapassa();
DROP FUNCTION IF EXISTS public.enforce_parcela_nao_ultrapassa();
DROP FUNCTION IF EXISTS public.recalcular_pagamentos(uuid);

/* ============================================================
   3. Restaure as versões anteriores das funções
      (estado após a migration 032)
   ============================================================ */

-- 3.1  ── recalcular_pagamentos  (usa SUM(valor_devido), não saldo)
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total          numeric(10,2);
    v_valor_pago     numeric(10,2);
    v_valor_parc     numeric(10,2);
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

    SELECT COALESCE(SUM(valor_devido),0)
      INTO v_valor_parc
      FROM public.contas_receber
     WHERE id_pedido = p_pedido_id;

    UPDATE public.pedidos
       SET valor_pago = v_valor_pago,
           quitado    = (v_valor_pago >= v_total),
           finalizado = (v_valor_pago >= v_total)           -- à vista
                     OR (v_valor_parc > 0),                 -- há parcelamento
           updated_at = now()
     WHERE id = p_pedido_id;
END;
$$;

-- 3.2  ── gatilho de pagamento à vista
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago_anteriores  numeric(10,2);
  v_valor_parc       numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* Pula se pagamento traz id_conta_receber (parcelado) */
  IF NEW.id_conta_receber IS NOT NULL THEN
     RETURN NEW;
  END IF;

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
       'Pagamento %.2f excede o restante do pedido (%.2f)',
       NEW.valor_pago - NEW.troco, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 3.3  ── gatilho de validação da parcela
CREATE OR REPLACE FUNCTION public.enforce_parcela_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total            numeric(10,2);
  v_pago             numeric(10,2);
  v_parcelas_outras  numeric(10,2);
  v_restante         numeric(10,2);
BEGIN
  /* Se UPDATE e valor_devido não mudou, ignora */
  IF TG_OP = 'UPDATE'
     AND NEW.valor_devido IS NOT DISTINCT FROM OLD.valor_devido THEN
        RETURN NEW;
  END IF;

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
       'Parcela %.2f excede o restante do pedido (%.2f)',
       NEW.valor_devido, v_restante
       USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

/* ============================================================
   4. Recria gatilhos apontando para as versões restauradas
   ============================================================ */

CREATE TRIGGER trg_pp_chk_restante
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pagamento_nao_ultrapassa();

CREATE TRIGGER trg_cr_chk_restante
BEFORE INSERT OR UPDATE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.enforce_parcela_nao_ultrapassa();

/* ============================================================
   5. Recalcula todos os pedidos para refletir a lógica antiga
   ============================================================ */
UPDATE public.pedidos
   SET updated_at = now();   -- dispara gatilhos de recálculo

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
