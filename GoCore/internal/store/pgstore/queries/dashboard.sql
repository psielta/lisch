-- name: GetTotalBrutoAndTotalPago :many
SELECT
    (data_pedido AT TIME ZONE 'America/Sao_Paulo')::date          AS dia,
    SUM(valor_total + COALESCE(taxa_entrega, 0) - COALESCE(desconto, 0) + COALESCE(acrescimo, 0))::numeric(12,2)        AS total_bruto,
    SUM(COALESCE(desconto, 0))::numeric(12,2) as total_desconto,
    SUM(COALESCE(acrescimo, 0))::numeric(12,2) as total_acrescimo,
    SUM(COALESCE(taxa_entrega, 0))::numeric(12,2) as total_taxa_entrega,
    SUM(COALESCE(valor_total, 0))::numeric(12,2) AS total_valor_total,
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


-- name: GetClientesMaisFaturados30Dias :many
/* Clientes mais faturados nos últimos 30 dias */
SELECT
    c.id                               AS id_cliente,
    c.nome_razao_social                AS cliente,
    SUM(   p.valor_total              
         + COALESCE(p.taxa_entrega,0) 
         + COALESCE(p.acrescimo,0)    
         - COALESCE(p.desconto,0)     
       )::numeric(12,2)                         AS valor_liquido
FROM  public.pedidos   p              
JOIN  public.clientes  c ON c.id = p.id_cliente   
WHERE p.deleted_at IS NULL                        
  AND (p.data_pedido AT TIME ZONE 'America/Sao_Paulo') 
        >= CURRENT_DATE - INTERVAL '29 days'           
  AND p.tenant_id = $1
GROUP BY c.id, c.nome_razao_social
ORDER BY valor_liquido DESC
LIMIT 100;

-- name: GetAniversariantes :many
/* Clientes cujo aniversário cai até 7 dias antes/depois de hoje */
WITH ref AS (
  SELECT
      CURRENT_DATE                           AS hoje,
      EXTRACT(DOY FROM CURRENT_DATE)::int    AS doy_hoje,
      366                                    AS ano_len  -- 2025 é bissexto
)
SELECT
    c.id,
    c.nome_razao_social     AS cliente,
    c.data_nascimento,
    -- próximo aniversário no ano corrente (para ordenação)
    make_date(EXTRACT(year FROM ref.hoje)::int,
              EXTRACT(month FROM c.data_nascimento)::int,
              LEAST(EXTRACT(day   FROM c.data_nascimento)::int, 28)  -- evita 29/02 em ano não-bissexto
             )                   AS proximo_aniversario
FROM public.clientes c, ref
WHERE c.data_nascimento IS NOT NULL
  /* Diferença absoluta entre os 'dia-do-ano' (com volta de 31/12 → 01/01) */
  AND LEAST(
        abs(EXTRACT(DOY FROM c.data_nascimento)::int - ref.doy_hoje),
        ref.ano_len - abs(EXTRACT(DOY FROM c.data_nascimento)::int - ref.doy_hoje)
      ) <= 7
  AND c.tenant_id = $1
ORDER BY proximo_aniversario;

-- name: GetTop100ProdutosMaisVendidos30Dias :many
/* Top 100 produtos mais vendidos (últimos 30 dias) */
/* ---------- Adicionais “por unidade” do item ---------- */
WITH add_por_unidade AS (
    SELECT id_pedido_item,
           SUM(valor * quantidade) AS add_unidade
    FROM   public.pedido_item_adicionais          -- lista de adicionais do item :contentReference[oaicite:0]{index=0}
    WHERE  deleted_at IS NULL
    GROUP  BY id_pedido_item
),

/* ---------- Itens, considerando ½-½ (id_produto_2) ---------- */
itens AS (
    /* produto da coluna id_produto */
    SELECT  pi.id,
            pi.id_pedido,
            pi.id_produto                          AS id_produto,
            pi.valor_unitario,
            pi.quantidade
    FROM    public.pedido_itens pi                 -- itens do pedido :contentReference[oaicite:1]{index=1}
    WHERE   pi.deleted_at IS NULL

    UNION ALL

    /* quando o item tem um segundo produto (ex.: pizza meio-a-meio) */
    SELECT  pi.id,
            pi.id_pedido,
            pi.id_produto_2                        AS id_produto,
            pi.valor_unitario,                     -- mesmo preço unitário
            pi.quantidade
    FROM    public.pedido_itens pi
    WHERE   pi.deleted_at IS NULL
      AND   pi.id_produto_2 IS NOT NULL
)

/* ---------- Top 100 ---------- */
SELECT
    pr.id                           AS id_produto,
    pr.nome                         AS produto,
    SUM( (it.valor_unitario
          + COALESCE(a.add_unidade,0))            -- preço unitário + adicionais
         * it.quantidade )::numeric(12,2)        AS valor_liquido,
    SUM(it.quantidade)::numeric(12,2)               AS unidades
FROM        itens it
LEFT  JOIN  add_por_unidade a ON a.id_pedido_item = it.id
JOIN        public.pedidos   p ON p.id = it.id_pedido
                               AND p.deleted_at IS NULL
JOIN        public.produtos  pr ON pr.id = it.id_produto          -- catálogo de produtos :contentReference[oaicite:2]{index=2}
WHERE (p.data_pedido AT TIME ZONE 'America/Sao_Paulo')::date
        >= CURRENT_DATE - INTERVAL '29 days'       -- 30 dias corridos
  AND p.tenant_id = $1
GROUP BY pr.id, pr.nome
ORDER BY valor_liquido DESC
LIMIT 100;


-- name: GetTicketMedio30Dias :many
/* Ticket médio da loja – últimos 30 dias */
WITH pedidos_30d AS (
    SELECT
        id,
        (valor_total
      + COALESCE(taxa_entrega, 0)
      + COALESCE(acrescimo,    0)
      - COALESCE(desconto,     0))::numeric(12,2)     AS valor_liquido
    FROM  public.pedidos
    WHERE deleted_at IS NULL
      AND (data_pedido AT TIME ZONE 'America/Sao_Paulo')::date
            >= CURRENT_DATE - INTERVAL '29 days'
  AND tenant_id = $1
)

SELECT
    ROUND(AVG(valor_liquido), 2) AS ticket_medio_30d,
    COUNT(*)                     AS qtde_pedidos_30d
FROM pedidos_30d;
