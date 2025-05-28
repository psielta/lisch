-- Write your migrate up statements here
/* 1 ▸ Remover a FK composta que causa o problema */
ALTER TABLE public.pedido_pagamentos
  DROP CONSTRAINT IF EXISTS fk_pp_conta_pedido;

/* 2 ▸ Criar a FK simples (só id_conta_receber)  */
ALTER TABLE public.pedido_pagamentos
  ADD CONSTRAINT fk_pp_conta
      FOREIGN KEY (id_conta_receber)
      REFERENCES public.contas_receber(id)
      ON DELETE SET NULL;   -- apenas ESTA coluna vira NULL

/* 3 ▸ Garantir que a conta pertence ao mesmo pedido  */
/*     (trigger BEFORE INSERT/UPDATE, sem sub-query em CHECK) */
CREATE OR REPLACE FUNCTION public.chk_pp_conta_mesmo_pedido()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id_conta_receber IS NOT NULL THEN
     PERFORM 1
       FROM public.contas_receber c
      WHERE c.id        = NEW.id_conta_receber
        AND c.id_pedido = NEW.id_pedido;
     IF NOT FOUND THEN
        RAISE EXCEPTION
          'Pagamento deve referir conta do mesmo pedido'
          USING ERRCODE = 'P0001';
     END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pp_chk_conta ON public.pedido_pagamentos;
CREATE TRIGGER trg_pp_chk_conta
BEFORE INSERT OR UPDATE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.chk_pp_conta_mesmo_pedido();

/* 4 ▸ Remover o índice auxiliar da FK composta, se existir */
DROP INDEX IF EXISTS public.uidx_cr_id_pedido;

---- create above / drop below ----
/* 1 ▸ Apaga trigger e FK simples */
DROP TRIGGER IF EXISTS trg_pp_chk_conta ON public.pedido_pagamentos;
DROP FUNCTION IF EXISTS public.chk_pp_conta_mesmo_pedido();
ALTER TABLE public.pedido_pagamentos
  DROP CONSTRAINT IF EXISTS fk_pp_conta;

/* 2 ▸ Recria índice para FK composta */
CREATE UNIQUE INDEX IF NOT EXISTS uidx_cr_id_pedido
       ON public.contas_receber(id, id_pedido);

/* 3 ▸ Reinstala a FK composta */
ALTER TABLE public.pedido_pagamentos
  ADD CONSTRAINT fk_pp_conta_pedido
      FOREIGN KEY (id_conta_receber, id_pedido)
      REFERENCES public.contas_receber(id, id_pedido)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY IMMEDIATE;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
