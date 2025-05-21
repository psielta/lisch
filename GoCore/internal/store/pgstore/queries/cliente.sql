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
       c.cpf LIKE '%' || $5 || '%' OR
       c.cnpj LIKE '%' || $5 || '%')
  -- Filtros específicos
  AND ($6 = '' OR LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($6)) || '%')
  AND ($7 = '' OR LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($7)) || '%')
  AND ($8 = '' OR c.cpf = $8)
  AND ($9 = '' OR c.cnpj = $9)
  AND ($10 = '' OR LOWER(unaccent(c.cidade)) LIKE '%' || LOWER(unaccent($10)) || '%')
  AND ($11 = '' OR c.uf = $11)
  AND ($12 = '' OR c.tipo_pessoa = $12)
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
LIMIT $2 OFFSET $13;

-- name: CountClientesPaginated :one
SELECT COUNT(*) 
FROM public.clientes c
WHERE c.tenant_id = $1
  -- Filtro geral
  AND ($2 = '' OR 
       LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($2)) || '%' OR 
       LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($2)) || '%' OR
       c.cpf LIKE '%' || $2 || '%' OR
       c.cnpj LIKE '%' || $2 || '%')
  -- Filtros específicos
  AND ($3 = '' OR LOWER(unaccent(c.nome_razao_social)) LIKE '%' || LOWER(unaccent($3)) || '%')
  AND ($4 = '' OR LOWER(unaccent(c.nome_fantasia)) LIKE '%' || LOWER(unaccent($4)) || '%')
  AND ($5 = '' OR c.cpf = $5)
  AND ($6 = '' OR c.cnpj = $6)
  AND ($7 = '' OR LOWER(unaccent(c.cidade)) LIKE '%' || LOWER(unaccent($7)) || '%')
  AND ($8 = '' OR c.uf = $8)
  AND ($9 = '' OR c.tipo_pessoa = $9);