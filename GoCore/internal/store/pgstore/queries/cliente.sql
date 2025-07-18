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
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetClienteByCPF :one
SELECT
    *
FROM public.clientes
WHERE cpf = $1
  AND tenant_id = $2
  AND deleted_at IS NULL;

-- name: GetClienteByCNPJ :one
SELECT
    *
FROM public.clientes
WHERE cnpj = $1
  AND tenant_id = $2
  AND deleted_at IS NULL;

-- name: ListClientesByTenant :many
SELECT
    *
FROM public.clientes
WHERE tenant_id = $1
  AND deleted_at IS NULL
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
  AND deleted_at IS NULL
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
  AND clientes.deleted_at IS NULL
RETURNING *;

-- name: DeleteCliente :exec
UPDATE public.clientes
SET deleted_at = now()
WHERE id = $1
  AND tenant_id = $2
  AND deleted_at IS NULL;

-- name: CountClientesByTenant :one
SELECT COUNT(*)
FROM public.clientes
WHERE tenant_id = $1
  AND deleted_at IS NULL;

-- name: ListClientesPaginated :many
SELECT
  c.*
FROM public.clientes c
WHERE c.tenant_id = $1
  AND c.deleted_at IS NULL
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
  AND c.deleted_at IS NULL
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
    CASE
        WHEN $3 = '' OR TRIM($3) = '' THEN 0
        WHEN unaccent(LOWER(c.nome_razao_social)) LIKE '%' || unaccent(LOWER(TRIM($3))) || '%' THEN 5
        WHEN unaccent(LOWER(COALESCE(c.nome_fantasia, ''))) LIKE '%' || unaccent(LOWER(TRIM($3))) || '%' THEN 4
        -- CORREÇÃO: só busca em telefone se o termo tem pelo menos 3 dígitos
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 AND
             regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 2
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 AND
             regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 1
        ELSE 0
    END as relevance_score
FROM public.clientes c
WHERE c.tenant_id = $1
  AND c.deleted_at IS NULL
  AND (
    $3 = '' OR
    -- Busca por nome (sempre executa para termos não vazios)
    unaccent(LOWER(c.nome_razao_social)) LIKE '%' || unaccent(LOWER(TRIM($3))) || '%' OR
    unaccent(LOWER(COALESCE(c.nome_fantasia, ''))) LIKE '%' || unaccent(LOWER(TRIM($3))) || '%' OR
    -- CORREÇÃO: só busca telefone se o termo tem pelo menos 3 dígitos
    (LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 AND (
        regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' OR
        regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%'
    ))
  )
ORDER BY
    relevance_score DESC,
    c.nome_razao_social ASC
LIMIT $2 OFFSET $4;

-- name: CountClientesSmartSearch :one
SELECT COUNT(*)
FROM public.clientes c
WHERE c.tenant_id = $1
  AND c.deleted_at IS NULL
  AND (
    $2 = '' OR
    -- Busca por nome
    unaccent(LOWER(c.nome_razao_social)) LIKE '%' || unaccent(LOWER(TRIM($2))) || '%' OR
    unaccent(LOWER(COALESCE(c.nome_fantasia, ''))) LIKE '%' || unaccent(LOWER(TRIM($2))) || '%' OR
    -- CORREÇÃO: só busca telefone se o termo tem pelo menos 3 dígitos
    (LENGTH(regexp_replace(TRIM($2), '[^0-9]', '', 'g')) >= 3 AND (
        regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($2), '[^0-9]', '', 'g') || '%' OR
        regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($2), '[^0-9]', '', 'g') || '%'
    ))
  );

-- name: ListClientesSmartSearchFuzzy :many
SELECT
    c.*,
    -- Score de relevância mais sofisticado
    CASE
        WHEN $3 = '' OR TRIM($3) = '' THEN 0
        -- Match exato no início do nome tem score maior
        WHEN LOWER(unaccent(c.nome_razao_social)) LIKE LOWER(unaccent(TRIM($3))) || '%' THEN 10
        WHEN LOWER(unaccent(COALESCE(c.nome_fantasia, ''))) LIKE LOWER(unaccent(TRIM($3))) || '%' THEN 9
        -- Match parcial no nome
        WHEN LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent(TRIM($3))) || '%' THEN 8
        WHEN LOWER(unaccent(COALESCE(c.nome_fantasia, ''))) LIKE '%' || LOWER(unaccent(TRIM($3))) || '%' THEN 7
        -- Match em telefones - SÓ SE O TERMO TEM PELO MENOS 3 DÍGITOS
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 
             AND regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 6
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 
             AND regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 6
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 
             AND regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 5
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 
             AND regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' THEN 5
        -- Busca adicional em telefone formatado - SÓ SE O TERMO TEM NÚMEROS
        WHEN LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 
             AND (COALESCE(c.telefone, '') LIKE '%' || TRIM($3) || '%' OR COALESCE(c.celular, '') LIKE '%' || TRIM($3) || '%') THEN 4
        ELSE 0
    END as relevance_score
FROM public.clientes c
WHERE c.tenant_id = $1
  AND c.deleted_at IS NULL
  AND (
    $3 = '' OR
    -- Busca em nomes (com e sem acentos)
    LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent(TRIM($3))) || '%' OR
    LOWER(unaccent(COALESCE(c.nome_fantasia, ''))) LIKE '%' || LOWER(unaccent(TRIM($3))) || '%' OR
    -- Busca em telefones APENAS SE TEM PELO MENOS 3 DÍGITOS
    (LENGTH(regexp_replace(TRIM($3), '[^0-9]', '', 'g')) >= 3 AND (
        regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' OR
        regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($3), '[^0-9]', '', 'g') || '%' OR
        -- Busca adicional: telefone formatado (com parênteses, hífens, etc)
        COALESCE(c.telefone, '') LIKE '%' || TRIM($3) || '%' OR
        COALESCE(c.celular, '') LIKE '%' || TRIM($3) || '%'
    ))
  )
ORDER BY
    relevance_score DESC,
    c.nome_razao_social ASC
LIMIT $2 OFFSET $4;

-- name: CountClientesSmartSearchFuzzy :one
SELECT COUNT(*)
FROM public.clientes c
WHERE c.tenant_id = $1
  AND c.deleted_at IS NULL
  AND (
    $2 = '' OR
    -- Busca em nomes
    LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent(TRIM($2))) || '%' OR
    LOWER(unaccent(COALESCE(c.nome_fantasia, ''))) LIKE '%' || LOWER(unaccent(TRIM($2))) || '%' OR
    -- Busca em telefones APENAS SE TEM PELO MENOS 3 DÍGITOS
    (LENGTH(regexp_replace(TRIM($2), '[^0-9]', '', 'g')) >= 3 AND (
        regexp_replace(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($2), '[^0-9]', '', 'g') || '%' OR
        regexp_replace(COALESCE(c.celular, ''), '[^0-9]', '', 'g') LIKE '%' || regexp_replace(TRIM($2), '[^0-9]', '', 'g') || '%' OR
        COALESCE(c.telefone, '') LIKE '%' || TRIM($2) || '%' OR
        COALESCE(c.celular, '') LIKE '%' || TRIM($2) || '%'
    ))
  );