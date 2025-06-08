-- Write your migrate up statements here
CREATE OR REPLACE FUNCTION public.upsert_operador_caixa(
    p_tenant_id uuid,
    p_id_usuario uuid,
    p_nome varchar(100),
    p_codigo varchar(20) DEFAULT NULL,
    p_ativo smallint DEFAULT 1
)
RETURNS TABLE(
    id uuid,
    seq_id bigint, 
    tenant_id uuid,
    id_usuario uuid,
    nome varchar(100),
    codigo varchar(20),
    ativo smallint,
    created_at timestamptz,
    updated_at timestamptz,
    action text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_operador_id uuid;
    v_action text;
BEGIN
    -- Verifica se já existe (incluindo soft deleted)
    SELECT oc.id INTO v_operador_id
    FROM public.operadores_caixa oc
    WHERE oc.tenant_id = p_tenant_id
      AND oc.id_usuario = p_id_usuario;
    
    IF v_operador_id IS NOT NULL THEN
        -- UPDATE (reativa se necessário)
        UPDATE public.operadores_caixa 
        SET nome = p_nome,
            codigo = p_codigo,
            ativo = p_ativo,
            updated_at = now(),
            deleted_at = NULL
        WHERE id = v_operador_id;
        
        v_action := 'UPDATED';
    ELSE
        -- INSERT
        INSERT INTO public.operadores_caixa (
            tenant_id, id_usuario, nome, codigo, ativo
        ) VALUES (
            p_tenant_id, p_id_usuario, p_nome, p_codigo, p_ativo
        ) RETURNING operadores_caixa.id INTO v_operador_id;
        
        v_action := 'INSERTED';
    END IF;
    
    -- Retorna o resultado
    RETURN QUERY
    SELECT 
        oc.id,
        oc.seq_id,
        oc.tenant_id,
        oc.id_usuario,
        oc.nome,
        oc.codigo,
        oc.ativo,
        oc.created_at,
        oc.updated_at,
        v_action::text
    FROM public.operadores_caixa oc
    WHERE oc.id = v_operador_id;
END;
$$;
---- create above / drop below ----
DROP FUNCTION IF EXISTS public.upsert_operador_caixa;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
