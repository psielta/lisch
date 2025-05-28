-- Write your migrate up statements here
/* ════════════════════════════════════════════════════════
   1. Função genérica de bloqueio
   ════════════════════════════════════════════════════════*/
CREATE OR REPLACE FUNCTION public.enforce_pedido_nao_editavel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_pedido_id uuid;
    v_locked    boolean;
BEGIN
    /* Descobre id do pedido conforme a tabela que disparou */
    IF TG_TABLE_NAME = 'pedidos' THEN
        v_pedido_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'pedido_itens' THEN
        v_pedido_id := COALESCE(NEW.id_pedido, OLD.id_pedido);
    ELSIF TG_TABLE_NAME = 'pedido_item_adicionais' THEN
        SELECT id_pedido
          INTO v_pedido_id
          FROM public.pedido_itens
         WHERE id = COALESCE(NEW.id_pedido_item, OLD.id_pedido_item);
    END IF;

    /* Verifica status */
    SELECT (finalizado OR quitado)
      INTO v_locked
      FROM public.pedidos
     WHERE id = v_pedido_id;

    IF v_locked THEN
       RAISE EXCEPTION
         'Pedido % já está finalizado/quitado: alterações não permitidas',
         v_pedido_id USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

/* ════════════════════════════════════════════════════════
   2. Triggers de bloqueio
   ════════════════════════════════════════════════════════*/
-- (a) Tabela PEDIDOS: impede UPDATE e DELETE
CREATE TRIGGER trg_pedidos_lock
BEFORE UPDATE OR DELETE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.enforce_pedido_nao_editavel();

-- (b) Tabela PEDIDO_ITENS
CREATE TRIGGER trg_pi_lock
BEFORE INSERT OR UPDATE OR DELETE ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.enforce_pedido_nao_editavel();

-- (c) Tabela PEDIDO_ITEM_ADICIONAIS
CREATE TRIGGER trg_pia_lock
BEFORE INSERT OR UPDATE OR DELETE ON public.pedido_item_adicionais
FOR EACH ROW EXECUTE FUNCTION public.enforce_pedido_nao_editavel();

---- create above / drop below ----
/* Remove triggers */
DROP TRIGGER IF EXISTS trg_pia_lock      ON public.pedido_item_adicionais;
DROP TRIGGER IF EXISTS trg_pi_lock       ON public.pedido_itens;
DROP TRIGGER IF EXISTS trg_pedidos_lock  ON public.pedidos;

/* Remove função */
DROP FUNCTION IF EXISTS public.enforce_pedido_nao_editavel();

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
