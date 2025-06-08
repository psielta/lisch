-- name: GetOpr :one
SELECT 
    oc.id,
    oc.seq_id,
    oc.tenant_id,
    oc.id_usuario,
    oc.nome,
    oc.codigo,
    oc.ativo,
    oc.created_at,
    oc.updated_at
FROM public.operadores_caixa oc
WHERE oc.id_usuario = $1
  AND oc.tenant_id = $2
  AND oc.deleted_at IS NULL LIMIT 1;

-- name: GetOperadorCaixa :many
SELECT 
    oc.id,
    oc.seq_id,
    oc.tenant_id,
    oc.id_usuario,
    oc.nome,
    oc.codigo,
    oc.ativo,
    oc.created_at,
    oc.updated_at
FROM public.operadores_caixa oc
WHERE oc.id_usuario = $1
  AND oc.deleted_at IS NULL
  AND oc.ativo = 1;

-- name: GetOperadorCaixaByIdUsuarioAndTenant :many
SELECT 
    oc.id,
    oc.seq_id,
    oc.tenant_id,
    oc.id_usuario,
    oc.nome,
    oc.codigo,
    oc.ativo,
    oc.created_at,
    oc.updated_at
FROM public.operadores_caixa oc
WHERE oc.id_usuario = $1
  AND oc.tenant_id = $2
  AND oc.deleted_at IS NULL
  AND oc.ativo = 1;

-- name: GetOperadorCaixaWithCaixaAtivo :many
SELECT 
    oc.id,
    oc.seq_id,
    oc.nome,
    oc.codigo,
    oc.ativo,
    c.id as caixa_id,
    c.data_abertura,
    c.valor_abertura,
    c.status as caixa_status
FROM public.operadores_caixa oc
LEFT JOIN public.caixas c ON c.id_operador = oc.id 
                          AND c.status = 'A' 
                          AND c.deleted_at IS NULL
WHERE oc.id_usuario = $1     -- UUID do usuário
  AND oc.tenant_id = $2      -- UUID do tenant
  AND oc.deleted_at IS NULL
  AND oc.ativo = 1;

-- name: IsOperadorAtivo :one
SELECT EXISTS (
    SELECT 1 
    FROM public.operadores_caixa 
    WHERE id_usuario = $1        -- UUID do usuário
      AND tenant_id = $2         -- UUID do tenant
      AND deleted_at IS NULL
      AND ativo = 1
) as is_operador;

-- ---------------------------------------------------------------------------
-- 2. UPSERT (INSERT ou UPDATE)
-- ---------------------------------------------------------------------------
-- name: UpsertOperadorCaixa :one
INSERT INTO public.operadores_caixa (
    tenant_id,
    id_usuario, 
    nome,
    codigo,
    ativo
) VALUES (
    $1,  -- tenant_id
    $2,  -- id_usuario
    $3,  -- nome
    $4,  -- codigo (pode ser NULL)
    $5   -- ativo (1 ou 0)
)
ON CONFLICT (tenant_id, id_usuario) 
DO UPDATE SET
    nome = EXCLUDED.nome,
    codigo = EXCLUDED.codigo,
    ativo = EXCLUDED.ativo,
    updated_at = now(),
    deleted_at = NULL  -- reativa se estava deletado
WHERE operadores_caixa.deleted_at IS NULL
RETURNING *;

-- name: UpsertOperadorCaixaCompleto :one
WITH upsert_operador AS (
    INSERT INTO public.operadores_caixa (
        tenant_id,
        id_usuario,
        nome, 
        codigo,
        ativo
    ) VALUES (
        $1,  -- tenant_id
        $2,  -- id_usuario  
        $3,  -- nome
        $4,  -- codigo
        $5   -- ativo
    )
    ON CONFLICT (tenant_id, id_usuario) 
    DO UPDATE SET
        nome = EXCLUDED.nome,
        codigo = EXCLUDED.codigo, 
        ativo = EXCLUDED.ativo,
        updated_at = now(),
        deleted_at = NULL
    WHERE operadores_caixa.deleted_at IS NULL
    RETURNING *
)
SELECT 
    id,
    seq_id,
    tenant_id,
    id_usuario,
    nome,
    codigo,
    ativo,
    created_at,
    updated_at
FROM upsert_operador;

-- name: CreateNewOperador :one
SELECT * FROM public.upsert_operador_caixa(
    $1,
    $2, 
    $3,
    NULL,
    1
);

-- name: UpdateOperador :one
SELECT * FROM public.upsert_operador_caixa(
    $1,
    $2,
    $3,
    NULL,
    1
);

-- name: ReativarOperadorF :one
SELECT * FROM public.upsert_operador_caixa(
    $1,
    $2,
    $3,
    NULL,  -- sem código
    1      -- reativar
);

-- name: ListarOperadoresAtivos :many
SELECT 
    oc.id,
    oc.nome,
    oc.codigo,
    u.email,
    oc.created_at,
    CASE 
        WHEN c.id IS NOT NULL THEN 'COM_CAIXA_ABERTO'
        ELSE 'DISPONIVEL'
    END as status_caixa
FROM public.operadores_caixa oc
JOIN public.users u ON u.id = oc.id_usuario
LEFT JOIN public.caixas c ON c.id_operador = oc.id 
                          AND c.status = 'A' 
                          AND c.deleted_at IS NULL
WHERE oc.tenant_id = $1
  AND oc.deleted_at IS NULL
  AND oc.ativo = 1
ORDER BY oc.nome;

-- name: ListarOperadoresDisponiveis :many
SELECT 
    oc.id,
    oc.nome,
    oc.codigo,
    u.email
FROM public.operadores_caixa oc
JOIN public.users u ON u.id = oc.id_usuario
WHERE oc.tenant_id = $1
  AND oc.deleted_at IS NULL  
  AND oc.ativo = 1
  AND NOT EXISTS (
      SELECT 1 FROM public.caixas c 
      WHERE c.id_operador = oc.id 
        AND c.status = 'A' 
        AND c.deleted_at IS NULL
  )
ORDER BY oc.nome;

-- name: ListarOperadoresComCaixaAberto :many
SELECT 
    oc.id,
    oc.nome,
    oc.codigo,
    c.id as caixa_id,
    c.data_abertura,
    c.valor_abertura
FROM public.operadores_caixa oc
JOIN public.caixas c ON c.id_operador = oc.id 
                     AND c.status = 'A'
                     AND c.deleted_at IS NULL
WHERE oc.tenant_id = $1
  AND oc.deleted_at IS NULL
  AND oc.ativo = 1
ORDER BY c.data_abertura DESC;

-- name: DesativarOperador :one
UPDATE public.operadores_caixa 
SET deleted_at = now(),
    updated_at = now()
WHERE id_usuario = $1 
  AND tenant_id = $2
  AND deleted_at IS NULL
RETURNING *;

-- name: ReativarOperador :one
UPDATE public.operadores_caixa
SET deleted_at = NULL,
    ativo = 1,
    updated_at = now()
WHERE id_usuario = $1
  AND tenant_id = $2
RETURNING *;

-- name: VerificarCodigoExiste :one
SELECT EXISTS (
    SELECT 1 FROM public.operadores_caixa
    WHERE tenant_id = $1
      AND codigo = $2
      AND deleted_at IS NULL
      AND id_usuario != $3  -- excluir o próprio usuário na edição
) as codigo_existe;

-- name: ContarOperadoresAtivos :one
SELECT COUNT(*) as total_operadores
FROM public.operadores_caixa
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND ativo = 1;