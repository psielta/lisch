-- ***********************
-- CLIENTES
-- ***********************

-- name: CreateCliente :one
INSERT INTO public.clientes (
    tenant_id,
    tipo_pessoa,
    nome_razao_social,
    nome_fantasia,
    cpf,
    cnpj,
    rg,
    ie,
    im,
    data_nascimento,
    email,
    telefone,
    celular,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf
) VALUES (
    $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10,
   $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
)
RETURNING
    *;

-- name: GetCliente :one
SELECT
    *
FROM public.clientes
WHERE id = $1;

-- name: GetClienteByCPF :one
SELECT
    *
FROM public.clientes
WHERE cpf = $1
  AND tenant_id = $2;

-- name: GetClienteByCNPJ :one
SELECT
    *
FROM public.clientes
WHERE cnpj = $1
  AND tenant_id = $2;

-- name: ListClientesByTenant :many
SELECT
    *
FROM public.clientes
WHERE tenant_id = $1
ORDER BY nome_razao_social
LIMIT  $2 OFFSET $3;

-- name: UpdateCliente :one
UPDATE public.clientes
SET
    tipo_pessoa        = $3,
    nome_razao_social  = $4,
    nome_fantasia      = $5,
    cpf                = $6,
    cnpj               = $7,
    rg                 = $8,
    ie                 = $9,
    im                 = $10,
    data_nascimento    = $11,
    email              = $12,
    telefone           = $13,
    celular            = $14,
    cep                = $15,
    logradouro         = $16,
    numero             = $17,
    complemento        = $18,
    bairro             = $19,
    cidade             = $20,
    uf                 = $21,
    updated_at         = now()
WHERE id        = $1   -- id do cliente
  AND tenant_id = $2   -- segurança multitenant
RETURNING
    *;

-- name: UpsertCliente :one
INSERT INTO public.clientes (
    id,
    tenant_id,
    nome_razao_social,
    celular,
    logradouro,
    numero,
    complemento,
    bairro,
    tipo_pessoa
)
VALUES (
    COALESCE($1, gen_random_uuid()),
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9
)
ON CONFLICT (id) DO UPDATE
SET
    nome_razao_social = $3,
    celular = $4,
    logradouro = $5,
    numero = $6,
    complemento = $7,
    bairro = $8,
    tipo_pessoa = $9,
    updated_at = now()
WHERE clientes.tenant_id = $2
RETURNING *;


-- name: DeleteCliente :exec
DELETE FROM public.clientes
WHERE id = $1
  AND tenant_id = $2;

-- name: CountClientesByTenant :one
SELECT COUNT(*)
FROM public.clientes
WHERE tenant_id = $1;

-- name: ListClientesPaginated :many
SELECT
  c.*
FROM public.clientes c
WHERE c.tenant_id = $1
  -- Filtro geral (pesquisa em nome/razão social, nome fantasia, cpf, cnpj)
  AND ($5 = '' OR 
       LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($5)) || '%' OR 
       LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($5)) || '%' OR
       regexp_replace(c.cpf, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($5, '[^0-9]', '', 'g') || '%' OR
       regexp_replace(c.cnpj, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($5, '[^0-9]', '', 'g') || '%')
  -- Filtros específicos
  AND ($6 = '' OR LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($6)) || '%')
  AND ($7 = '' OR LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($7)) || '%')
  AND ($8 = '' OR regexp_replace(c.cpf, '[^0-9]', '', 'g') = regexp_replace($8, '[^0-9]', '', 'g'))
  AND ($9 = '' OR regexp_replace(c.cnpj, '[^0-9]', '', 'g') = regexp_replace($9, '[^0-9]', '', 'g'))
  AND ($10 = '' OR LOWER(unaccent(c.cidade)) LIKE '%' || LOWER(unaccent($10)) || '%')
  AND ($11 = '' OR c.uf = $11)
  AND ($12 = '' OR c.tipo_pessoa = $12)
  AND ($13 = '' OR regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($13, '[^0-9]', '', 'g') || '%')
  AND ($14 = '' OR regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($14, '[^0-9]', '', 'g') || '%')
ORDER BY 
  CASE WHEN $3 = 'nome' AND $4 = 'asc' THEN c.nome_razao_social END ASC,
  CASE WHEN $3 = 'nome' AND $4 = 'desc' THEN c.nome_razao_social END DESC,
  CASE WHEN $3 = 'fantasia' AND $4 = 'asc' THEN c.nome_fantasia END ASC,
  CASE WHEN $3 = 'fantasia' AND $4 = 'desc' THEN c.nome_fantasia END DESC,
  CASE WHEN $3 = 'cidade' AND $4 = 'asc' THEN c.cidade END ASC,
  CASE WHEN $3 = 'cidade' AND $4 = 'desc' THEN c.cidade END DESC,
  CASE WHEN $3 = 'data_cadastro' AND $4 = 'asc' THEN c.created_at END ASC,
  CASE WHEN $3 = 'data_cadastro' AND $4 = 'desc' THEN c.created_at END DESC,
  CASE WHEN $3 = 'ultima_atualizacao' AND $4 = 'asc' THEN c.updated_at END ASC,
  CASE WHEN $3 = 'ultima_atualizacao' AND $4 = 'desc' THEN c.updated_at END DESC,
  CASE WHEN $3 = '' THEN c.nome_razao_social END ASC
LIMIT $2 OFFSET $15;

-- name: CountClientesPaginated :one
SELECT COUNT(*) 
FROM public.clientes c
WHERE c.tenant_id = $1
  -- Filtro geral
  AND ($2 = '' OR 
       LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($2)) || '%' OR 
       LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($2)) || '%' OR
       regexp_replace(c.cpf, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($2, '[^0-9]', '', 'g') || '%' OR
       regexp_replace(c.cnpj, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($2, '[^0-9]', '', 'g') || '%')
  -- Filtros específicos
  AND ($3 = '' OR LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%')
  AND ($4 = '' OR LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($4)) || '%')
  AND ($5 = '' OR regexp_replace(c.cpf, '[^0-9]', '', 'g') = regexp_replace($5, '[^0-9]', '', 'g'))
  AND ($6 = '' OR regexp_replace(c.cnpj, '[^0-9]', '', 'g') = regexp_replace($6, '[^0-9]', '', 'g'))
  AND ($7 = '' OR LOWER(unaccent(c.cidade)) LIKE '%' || LOWER(unaccent($7)) || '%')
  AND ($8 = '' OR c.uf = $8)
  AND ($9 = '' OR c.tipo_pessoa = $9)
  AND ($10 = '' OR regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($10, '[^0-9]', '', 'g') || '%')
  AND ($11 = '' OR regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($11, '[^0-9]', '', 'g') || '%');

-- name: ListClientesSmartSearch :many
SELECT
    c.*,
    -- Score para ordenar por relevância (opcional)
    CASE
        WHEN $3 = '' THEN 0
        WHEN LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%' THEN 3
        WHEN LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($3)) || '%' THEN 2
        WHEN regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 1
        WHEN regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 1
        ELSE 0
        END as relevance_score
FROM public.clientes c
WHERE c.tenant_id = $1
  AND (
    $3 = '' OR
        -- Busca em nome/razão social (maior prioridade)
    LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%' OR
        -- Busca em nome fantasia
    LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($3)) || '%' OR
        -- Busca em telefone (apenas números)
    regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' OR
        -- Busca em celular (apenas números)
    regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%'
    )
ORDER BY
    -- Ordena por relevância primeiro, depois por nome
    relevance_score DESC,
    c.nome_razao_social ASC
    LIMIT $2 OFFSET $4;

-- name: CountClientesSmartSearch :one
SELECT COUNT(*)
FROM public.clientes c
WHERE c.tenant_id = $1
  AND (
    $2 = '' OR
        -- Busca em nome/razão social
    LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($2)) || '%' OR
        -- Busca em nome fantasia
    LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($2)) || '%' OR
        -- Busca em telefone (apenas números)
    regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($2, '[^0-9]', '', 'g') || '%' OR
        -- Busca em celular (apenas números)
    regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($2, '[^0-9]', '', 'g') || '%'
    );

-- name: ListClientesSmartSearchFuzzy :many
SELECT
    c.*,
    -- Score de relevância mais sofisticado
    CASE
        WHEN $3 = '' THEN 0
        -- Match exato no início do nome tem score maior
        WHEN LOWER(unaccent(c.nome_razao_social)) LIKE LOWER(unaccent($3)) || '%' THEN 5
        WHEN LOWER(unaccent(c.nome_fantasia)) LIKE LOWER(unaccent($3)) || '%' THEN 4
        -- Match parcial no nome
        WHEN LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%' THEN 3
        WHEN LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($3)) || '%' THEN 2
        -- Match em telefones
        WHEN regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 2
        WHEN regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 2
        WHEN regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 1
        WHEN regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' THEN 1
        ELSE 0
        END as relevance_score
FROM public.clientes c
WHERE c.tenant_id = $1
  AND (
    $3 = '' OR
        -- Busca em nomes (com e sem acentos)
    LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%' OR
    LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($3)) || '%' OR
        -- Busca em telefones (flexível - aceita com ou sem formatação)
    regexp_replace(c.telefone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' OR
    regexp_replace(c.celular, '[^0-9]', '', 'g') LIKE '%' || regexp_replace($3, '[^0-9]', '', 'g') || '%' OR
        -- Busca adicional: telefone formatado
    c.telefone LIKE '%' || $3 || '%' OR
    c.celular LIKE '%' || $3 || '%'
    )
ORDER BY
    relevance_score DESC,
    c.nome_razao_social ASC
    LIMIT $2 OFFSET $4;