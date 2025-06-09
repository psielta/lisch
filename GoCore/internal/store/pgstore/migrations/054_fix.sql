-- Write your migrate up statements here
-- 1. Tabela de controle da sequência por caixa
CREATE TABLE IF NOT EXISTS public.pedido_seq_caixa (
    id_caixa uuid PRIMARY KEY,
    seq      integer NOT NULL
);

-- 2. Nova versão da função
CREATE OR REPLACE FUNCTION public.gen_codigo_pedido() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_seq bigint;   -- seq_id do tenant
    v_caixa_id   uuid;     -- caixa aberto
    v_caixa_seq  int;      -- sequência dentro do caixa
    v_stamp      text;     -- data-hora compacta
BEGIN
    /* ---------- seq_id do tenant ---------- */
    SELECT seq_id
      INTO v_tenant_seq
      FROM public.tenants
     WHERE id = NEW.tenant_id;

    IF v_tenant_seq IS NULL THEN
        RAISE EXCEPTION 'Tenant % não possui seq_id', NEW.tenant_id
              USING ERRCODE = 'P0001';
    END IF;

    /* ---------- caixa aberto ---------- */
    v_caixa_id := public.get_caixa_ativo(NEW.tenant_id);

    IF v_caixa_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum caixa aberto para o tenant %', NEW.tenant_id
              USING ERRCODE = 'P0001';
    END IF;

    /* ---------- sequência por caixa ---------- */
    INSERT INTO public.pedido_seq_caixa (id_caixa, seq)
         VALUES (v_caixa_id, 1)
    ON CONFLICT (id_caixa)
         DO UPDATE SET seq = pedido_seq_caixa.seq + 1
    RETURNING seq INTO v_caixa_seq;

    /* ---------- gera código ---------- */
    v_stamp := to_char(COALESCE(NEW.data_pedido, now()), 'YYYYMMDDHH24MISS');

    NEW.codigo_pedido :=
        format('P-%s-%s-%s', v_tenant_seq, v_stamp, v_caixa_seq);

    RETURN NEW;
END;
$$;
---- create above / drop below ----
-- 1. Remove função modificada
DROP FUNCTION IF EXISTS public.gen_codigo_pedido();

-- 2. Restaura versão anterior baseada em pedido_seq_diaria
CREATE FUNCTION public.gen_codigo_pedido() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_seq bigint;
    v_daily_seq  int;
    v_data       date;
    v_hora       text;
BEGIN
    SELECT seq_id INTO v_tenant_seq
      FROM public.tenants
     WHERE id = NEW.tenant_id;

    IF v_tenant_seq IS NULL THEN
        RAISE EXCEPTION 'Tenant % não possui seq_id', NEW.tenant_id
              USING ERRCODE = 'P0001';
    END IF;

    v_data := COALESCE(NEW.data_pedido, now())::date;

    INSERT INTO public.pedido_seq_diaria (tenant_id, dia, seq)
         VALUES (NEW.tenant_id, v_data, 1)
    ON CONFLICT (tenant_id, dia)
         DO UPDATE SET seq = pedido_seq_diaria.seq + 1
    RETURNING seq INTO v_daily_seq;

    v_hora := to_char(COALESCE(NEW.data_pedido, now()), 'HH24MISS');

    NEW.codigo_pedido :=
        format('P-%s-%s-%s-%s',
               v_tenant_seq,
               to_char(v_data, 'YYYYMMDD'),
               v_hora,
               v_daily_seq);

    RETURN NEW;
END;
$$;

-- 3. Remove a tabela auxiliar
DROP TABLE IF EXISTS public.pedido_seq_caixa;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
