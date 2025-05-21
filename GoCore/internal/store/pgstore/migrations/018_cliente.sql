-- Write your migrate up statements here
/* ================================
   Tabela: clientes
   ================================ */
CREATE TABLE public.clientes (
    id                  UUID                DEFAULT gen_random_uuid()  NOT NULL,
    tenant_id           UUID                                            NOT NULL,   -- FK → tenants.id

    -- Identificação
    tipo_pessoa         CHAR(1)                                        NOT NULL,   -- 'F' = física | 'J' = jurídica
    nome_razao_social   TEXT                                           NOT NULL,
    nome_fantasia       TEXT,                                                      -- opcional para pessoa jurídica

    -- Documentos (somente um dos dois deve estar presente, conforme tipo_pessoa)
    cpf                 VARCHAR(11)  CHECK (cpf  ~ '^[0-9]{11}$'),
    cnpj                VARCHAR(14)  CHECK (cnpj ~ '^[0-9]{14}$'),
    rg                  VARCHAR(20),        -- documento de identidade (pessoa física)
    ie                  VARCHAR(20),        -- inscrição estadual (pessoa jurídica)
    im                  VARCHAR(20),        -- inscrição municipal (pessoa jurídica)

    data_nascimento     DATE,               -- pessoa física

    -- Contato
    email               TEXT,
    telefone            VARCHAR(30),
    celular             VARCHAR(30),

    -- Endereço
    cep                 VARCHAR(8) CHECK (cep ~ '^[0-9]{8}$'),
    logradouro          TEXT,
    numero              VARCHAR(10),
    complemento         TEXT,
    bairro              TEXT,
    cidade              TEXT,
    uf                  CHAR(2)  CHECK (uf ~ '^[A-Z]{2}$'),

    -- Auditoria
    created_at          TIMESTAMPTZ         DEFAULT now()              NOT NULL,
    updated_at          TIMESTAMPTZ         DEFAULT now()              NOT NULL,

    /* ============================
       Restrições
       ============================ */
    CONSTRAINT clientes_pkey            PRIMARY KEY (id),

    -- Relacionamento com tenants
    CONSTRAINT clientes_tenant_fk
        FOREIGN KEY (tenant_id)
        REFERENCES public.tenants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Garante que CPF ou CNPJ sejam únicos por tenant
    CONSTRAINT clientes_cpf_unq  UNIQUE (tenant_id, cpf),
    CONSTRAINT clientes_cnpj_unq UNIQUE (tenant_id, cnpj),

    -- Somente um dos documentos deve estar presente, conforme o tipo de pessoa
    CONSTRAINT clientes_doc_chk CHECK (
        (tipo_pessoa = 'F' AND cpf  IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'J' AND cnpj IS NOT NULL AND cpf  IS NULL)
    )
);

/* Proprietário da tabela */
ALTER TABLE public.clientes
  OWNER TO "ADM";

/* Índices recomendados */
CREATE INDEX idx_clientes_tenant     ON public.clientes (tenant_id);
CREATE INDEX idx_clientes_cidade_uf  ON public.clientes (cidade, uf);

---- create above / drop below ----
-- migrate down
DROP TABLE public.clientes;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
