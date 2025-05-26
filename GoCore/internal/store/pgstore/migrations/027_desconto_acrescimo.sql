-- Write your migrate up statements here
/* 1 ─── colunas em pedidos */
ALTER TABLE public.pedidos
  ADD COLUMN desconto  numeric(10,2) DEFAULT 0 NOT NULL
                       CHECK (desconto  >= 0),
  ADD COLUMN acrescimo numeric(10,2) DEFAULT 0 NOT NULL
                       CHECK (acrescimo >= 0);

/* 2 ─── recalcular_pagamentos (pedido) */
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total      numeric(10,2);
    v_valor_pago numeric(10,2);
BEGIN
    /* agora soma entrega + acrescimo – desconto */
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

/* 3 ─── gatilho anti-ultrapasso */
CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total           numeric(10,2);
  v_pago_anteriores numeric(10,2);
  v_restante        numeric(10,2);
BEGIN
  /* total com entrega, acrescimo e desconto */
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

/* 4 ─── (opcional) atualiza todos os pedidos existentes */
UPDATE public.pedidos SET updated_at = now();  -- força recálculo via trigger

---- create above / drop below ----
/* 1 ─── restaurar funções sem desconto/acréscimo */
CREATE OR REPLACE FUNCTION public.recalcular_pagamentos(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_total      numeric(10,2);
    v_valor_pago numeric(10,2);
BEGIN
    SELECT valor_total + COALESCE(taxa_entrega,0)
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

CREATE OR REPLACE FUNCTION public.enforce_pagamento_nao_ultrapassa()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_total           numeric(10,2);
  v_pago_anteriores numeric(10,2);
  v_restante        numeric(10,2);
BEGIN
  SELECT valor_total + COALESCE(taxa_entrega,0)
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

/* 2 ─── remover colunas */
ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS desconto,
  DROP COLUMN IF EXISTS acrescimo;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
