-- name: GetTotalBrutoAndTotalPago :many
SELECT
    (data_pedido AT TIME ZONE 'America/Sao_Paulo')::date          AS dia,
    SUM(valor_total + COALESCE(taxa_entrega, 0) - COALESCE(desconto, 0) + COALESCE(acrescimo, 0))::numeric(12,2)        AS total_bruto,
    SUM(COALESCE(valor_pago, 0))::numeric(12,2)                                               AS total_pago
FROM  public.pedidos
WHERE deleted_at IS NULL
  AND (data_pedido AT TIME ZONE 'America/Sao_Paulo')::date
        >= CURRENT_DATE - INTERVAL '89 days'
  AND tenant_id = $1
GROUP BY dia
ORDER BY dia;

-- name: GetTotalBrutoAndTotalPagoDetailed :many
SELECT
    p.*,
    (p.valor_total + COALESCE(p.taxa_entrega, 0) - COALESCE(p.desconto, 0) + COALESCE(p.acrescimo, 0))::numeric(12,2) AS valor_bruto,
    (p.data_pedido AT TIME ZONE 'America/Sao_Paulo')            AS data_pedido_br,
    (p.data_pedido AT TIME ZONE 'America/Sao_Paulo')::date      AS dia,
    s.descricao                                                 AS status_descr,
    c.nome_razao_social                                         AS cliente
FROM  public.pedidos           p
LEFT  JOIN public.pedido_status s ON s.id       = p.id_status
LEFT  JOIN public.clientes      c ON c.id       = p.id_cliente
WHERE p.deleted_at IS NULL
  AND (p.data_pedido AT TIME ZONE 'America/Sao_Paulo')::date 
        >= CURRENT_DATE - INTERVAL '89 days'
  AND p.tenant_id = $1
ORDER BY p.data_pedido DESC;
