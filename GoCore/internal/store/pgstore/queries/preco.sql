-- SQLC Queries para Preços de Produtos

-- ***********************
-- PRODUTO_PRECOS
-- ***********************

-- name: CreateProdutoPreco :one
INSERT INTO produto_precos (
    id_produto,
    id_categoria_opcao,
    codigo_externo_opcao_preco,
    preco_base,
    preco_promocional,
    disponivel
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id, seq_id, id_produto, id_categoria_opcao, codigo_externo_opcao_preco, preco_base, preco_promocional, disponivel, created_at, updated_at;

-- name: GetProdutoPreco :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.id = $1 AND pp.deleted_at IS NULL;

-- name: GetProdutoPrecoBySeqID :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.seq_id = $1 AND pp.deleted_at IS NULL;

-- name: GetProdutoPrecoByCodigoExternoAndProduto :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.codigo_externo_opcao_preco = $1 AND pp.id_produto = $2 AND pp.deleted_at IS NULL;

-- name: ListProdutoPrecosByProduto :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao -- Incluindo nome da opção da categoria para referência
FROM produto_precos pp
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND pp.deleted_at IS NULL AND co.deleted_at IS NULL
ORDER BY co.nome -- Ou alguma outra lógica de ordenação para as opções
LIMIT $2 OFFSET $3;

-- name: ListProdutoPrecosByProdutoAndTenant :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao,
    cat.id_tenant
FROM produto_precos pp
JOIN produtos p ON pp.id_produto = p.id
JOIN categorias cat ON p.id_categoria = cat.id
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND cat.id_tenant = $2 AND pp.deleted_at IS NULL AND p.deleted_at IS NULL AND cat.deleted_at IS NULL AND co.deleted_at IS NULL
ORDER BY co.nome
LIMIT $3 OFFSET $4;


-- name: UpdateProdutoPreco :one
-- Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
UPDATE produto_precos pp
SET
    id_categoria_opcao = $4,
    codigo_externo_opcao_preco = $5,
    preco_base = $6,
    preco_promocional = $7,
    disponivel = $8,
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND p.id = $2 -- id_produto (para garantir que o preco é deste produto)
  AND c.id_tenant = $3 -- id_tenant
  AND pp.deleted_at IS NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at;

-- name: SoftDeleteProdutoPreco :exec
-- Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
UPDATE produto_precos pp
SET deleted_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NULL;

-- name: HardDeleteProdutoPreco :exec
-- Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
DELETE FROM produto_precos pp
USING produtos p, categorias c
WHERE pp.id_produto = p.id
  AND p.id_categoria = c.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2; -- id_tenant

-- name: UpdateProdutoPrecoDisponibilidade :one
-- Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
UPDATE produto_precos pp
SET
    disponivel = $3, -- novo_status_disponibilidade
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at;

-- name: RestoreProdutoPreco :one
-- Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
UPDATE produto_precos pp
SET deleted_at = NULL,
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NOT NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at;

-- name: ListProdutoPrecosAtivosByProduto :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao
FROM produto_precos pp
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND pp.disponivel = 1 AND pp.deleted_at IS NULL AND co.deleted_at IS NULL AND co.status = 1
ORDER BY co.nome;