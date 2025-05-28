-- Write your migrate up statements here
/************************************************************
  1.  Recria enforce_pedido_nao_editavel com exceção p/ UPDATE
*************************************************************/
CREATE OR REPLACE FUNCTION public.enforce_pedido_nao_editavel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_pedido_id uuid;
    v_locked    boolean;
    v_changed_other boolean := false;
BEGIN
    /* ── Descobre o pedido conforme a tabela ── */
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

    /* ── Status do pedido ── */
    SELECT (finalizado OR quitado)
      INTO v_locked
      FROM public.pedidos
     WHERE id = v_pedido_id;

    /* ─────────────────────────────────────────
       REGRA:
       • Se não está locked → permite tudo.
       • Se está locked:
           – bloqueia INSERT/DELETE em itens/adicionais
           – bloqueia DELETE do próprio pedido
           – bloqueia UPDATE que mude QUALQUER coluna
             diferente de: valor_pago, quitado, finalizado, updated_at
    ───────────────────────────────────────── */
    IF v_locked THEN
       IF TG_TABLE_NAME = 'pedidos' AND TG_OP = 'UPDATE' THEN
          /* Verifica se mudou algo além das colunas permitidas */
          v_changed_other :=
                (NEW.valor_total      IS DISTINCT FROM  OLD.valor_total)
             OR (NEW.taxa_entrega     IS DISTINCT FROM  OLD.taxa_entrega)
             OR (NEW.desconto         IS DISTINCT FROM  OLD.desconto)
             OR (NEW.acrescimo        IS DISTINCT FROM  OLD.acrescimo)
             OR (NEW.observacao       IS DISTINCT FROM  OLD.observacao)
             OR (NEW.tipo_entrega     IS DISTINCT FROM  OLD.tipo_entrega)
             OR (NEW.prazo            IS DISTINCT FROM  OLD.prazo)
             OR (NEW.prazo_min        IS DISTINCT FROM  OLD.prazo_min)
             OR (NEW.prazo_max        IS DISTINCT FROM  OLD.prazo_max)
             OR (NEW.id_status        IS DISTINCT FROM  OLD.id_status)
             OR (NEW.deleted_at       IS DISTINCT FROM  OLD.deleted_at);  -- etc.

          IF v_changed_other THEN
             RAISE EXCEPTION
               'Pedido % já está finalizado/quitado: alterações não permitidas',
               v_pedido_id USING ERRCODE = 'P0001';
          END IF;

       ELSIF TG_TABLE_NAME = 'pedidos' AND TG_OP = 'DELETE' THEN
          RAISE EXCEPTION
            'Pedido % já está finalizado/quitado: exclusão não permitida',
            v_pedido_id USING ERRCODE = 'P0001';

       ELSIF TG_TABLE_NAME <> 'pedidos' THEN
          /* Itens ou adicionais – bloqueia qualquer ação */
          RAISE EXCEPTION
            'Pedido % já está finalizado/quitado: alterações em itens não permitidas',
            v_pedido_id USING ERRCODE = 'P0001';
       END IF;
    END IF;

    RETURN NEW;
END;
$$;

/************************************************************
  2.  (Os triggers criados na 035 continuam válidos)
*************************************************************/

---- create above / drop below ----
/************************************************************
  Volta à versão “tudo bloqueado” da 035
*************************************************************/
CREATE OR REPLACE FUNCTION public.enforce_pedido_nao_editavel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_pedido_id uuid;
    v_locked    boolean;
BEGIN
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

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
