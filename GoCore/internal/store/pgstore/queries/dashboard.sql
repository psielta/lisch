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

-- name: GetPagamentosPorDiaECategoria :many
/*
  Pagamentos líquidos (valor_pago – troco) dos últimos 3 meses,
  agrupados por DIA e CATEGORIA de pagamento.
  • O tenant é passado no parâmetro $1.
*/
SELECT
    (pp.created_at AT TIME ZONE 'America/Sao_Paulo')::date          AS dia,
    pp.categoria_pagamento,
    SUM(pp.valor_pago - COALESCE(pp.troco, 0))::numeric(12,2)       AS valor_liquido
FROM   public.pedido_pagamentos pp
JOIN   public.pedidos          p  ON p.id = pp.id_pedido            -- garante o tenant
WHERE  pp.deleted_at IS NULL
  AND  p.deleted_at  IS NULL
  AND  p.tenant_id   = $1
  AND  (pp.created_at AT TIME ZONE 'America/Sao_Paulo')::date
         >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY dia, pp.categoria_pagamento
ORDER BY dia, pp.categoria_pagamento;

-- name: GetPagamentosDetalhadosUlt3Meses :many
/*
  Lista cada pagamento individual dos últimos 3 meses.
  Campos suficientes para o modal, sem `forma_pagamento`.
*/
SELECT
    pp.id,
    pp.id_pedido,
    pp.categoria_pagamento,
    pp.valor_pago,
    pp.troco,
    (pp.valor_pago - COALESCE(pp.troco, 0))::numeric(12,2)          AS valor_liquido,
    (pp.created_at AT TIME ZONE 'America/Sao_Paulo')                AS created_br,
    (pp.created_at AT TIME ZONE 'America/Sao_Paulo')::date          AS dia,
    p.codigo_pedido,
    (p.data_pedido AT TIME ZONE 'America/Sao_Paulo')                AS data_pedido_br,
    c.nome_razao_social                                             AS cliente
FROM   public.pedido_pagamentos pp
JOIN   public.pedidos          p  ON p.id       = pp.id_pedido
LEFT   JOIN public.clientes     c  ON c.id       = p.id_cliente
WHERE  pp.deleted_at IS NULL
  AND  p.deleted_at  IS NULL
  AND  p.tenant_id   = $1
  AND  (pp.created_at AT TIME ZONE 'America/Sao_Paulo')::date
         >= CURRENT_DATE - INTERVAL '3 months'
ORDER BY pp.created_at DESC;
