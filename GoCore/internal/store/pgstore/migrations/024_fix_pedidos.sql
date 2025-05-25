-- Write your migrate up statements here
-- Corrige a função central sem tocar nas triggers existentes
CREATE OR REPLACE FUNCTION public.recalcular_total_pedido(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_total numeric(10,2);
BEGIN
    /* soma dos adicionais que se aplicam a **uma** unidade do item */
    WITH add_por_unidade AS (
        SELECT id_pedido_item,
               SUM(valor * quantidade) AS add_unidade
        FROM   public.pedido_item_adicionais
        WHERE  deleted_at IS NULL
        GROUP  BY id_pedido_item
    )
    SELECT COALESCE(
             SUM(  (pi.valor_unitario
                    + COALESCE(a.add_unidade,0))  -- preço unitário + adicionais
                  * pi.quantidade                 -- multiplica pela qtde do item
               ), 0)
      INTO v_total
      FROM public.pedido_itens   pi
      LEFT JOIN add_por_unidade a ON a.id_pedido_item = pi.id
      WHERE pi.id_pedido = p_pedido_id
        AND pi.deleted_at IS NULL;

    UPDATE public.pedidos
       SET valor_total = v_total,
           updated_at  = NOW()
     WHERE id = p_pedido_id;
END;
$$;

-- Recalcula todos os pedidos já existentes somente uma vez
SELECT public.recalcular_total_pedido(id)
  FROM public.pedidos;
---- create above / drop below ----
CREATE OR REPLACE FUNCTION public.recalcular_total_pedido(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_total numeric(10,2);
BEGIN
    WITH add_tot AS (
        SELECT id_pedido_item,
               SUM(valor * quantidade) AS total_add
        FROM   public.pedido_item_adicionais
        WHERE  deleted_at IS NULL
        GROUP  BY id_pedido_item
    )
    SELECT COALESCE(
             SUM( pi.valor_unitario * pi.quantidade
                + COALESCE(a.total_add, 0) ), 0)
      INTO v_total
      FROM public.pedido_itens pi
      LEFT JOIN add_tot a ON a.id_pedido_item = pi.id
      WHERE pi.id_pedido = p_pedido_id
        AND pi.deleted_at IS NULL;

    UPDATE public.pedidos
       SET valor_total = v_total,
           updated_at  = NOW()
     WHERE id = p_pedido_id;
END;
$$;

-- Ajusta todos os pedidos novamente para o cálculo antigo
SELECT public.recalcular_total_pedido(id)
  FROM public.pedidos;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
