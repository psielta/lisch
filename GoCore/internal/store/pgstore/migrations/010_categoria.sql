-- Write your migrate up statements here
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seq_id BIGSERIAL UNIQUE,
    id_tenant UUID NOT NULL,
    id_culinaria INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    inicio TIME NOT NULL DEFAULT '00:00:00',
    fim TIME NOT NULL DEFAULT '00:00:00',
    ativo SMALLINT NOT NULL DEFAULT 1,
    opcao_meia VARCHAR(1) DEFAULT '',
    ordem INTEGER,
    disponivel_domingo SMALLINT NOT NULL DEFAULT 1,
    disponivel_segunda SMALLINT NOT NULL DEFAULT 1,
    disponivel_terca SMALLINT NOT NULL DEFAULT 1,
    disponivel_quarta SMALLINT NOT NULL DEFAULT 1,
    disponivel_quinta SMALLINT NOT NULL DEFAULT 1,
    disponivel_sexta SMALLINT NOT NULL DEFAULT 1,
    disponivel_sabado SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_categorias_tenant
        FOREIGN KEY (id_tenant)
        REFERENCES public.tenants (id),
        
    CONSTRAINT fk_categorias_culinarias
        FOREIGN KEY (id_culinaria)
        REFERENCES culinarias (id_culinaria)
);

-- Tabela para armazenar opções de categorias (tamanhos, variações, etc.)
CREATE TABLE categoria_opcoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seq_id BIGSERIAL UNIQUE,
    id_categoria UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_categoria_opcoes_categorias
        FOREIGN KEY (id_categoria)
        REFERENCES categorias (id)
);

-- Comentários nas tabelas e colunas para documentação
COMMENT ON TABLE categorias IS 'Armazena as categorias de produtos do cardápio de um tenant';
COMMENT ON COLUMN categorias.id IS 'Identificador único UUID da categoria';
COMMENT ON COLUMN categorias.seq_id IS 'Identificador sequencial para facilitar CRUD';
COMMENT ON COLUMN categorias.id_tenant IS 'ID do tenant ao qual a categoria pertence';
COMMENT ON COLUMN categorias.id_culinaria IS 'Referência ao tipo de culinária da categoria';
COMMENT ON COLUMN categorias.nome IS 'Nome da categoria exibido no cardápio';
COMMENT ON COLUMN categorias.descricao IS 'Descrição da categoria';
COMMENT ON COLUMN categorias.inicio IS 'Horário de início da disponibilidade da categoria';
COMMENT ON COLUMN categorias.fim IS 'Horário de fim da disponibilidade da categoria';
COMMENT ON COLUMN categorias.ativo IS 'Status da categoria (1=ativo, 0=inativo)';
COMMENT ON COLUMN categorias.opcao_meia IS 'Opção para meio a meio (M=Valor médio, V=Maior valor, vazio=Não permitido)';
COMMENT ON COLUMN categorias.ordem IS 'Ordem de exibição da categoria no cardápio';
COMMENT ON COLUMN categorias.deleted_at IS 'Data e hora de exclusão lógica (soft delete)';

COMMENT ON TABLE categoria_opcoes IS 'Armazena as opções disponíveis para cada categoria (ex: tamanhos)';
COMMENT ON COLUMN categoria_opcoes.id IS 'Identificador único UUID da opção';
COMMENT ON COLUMN categoria_opcoes.seq_id IS 'Identificador sequencial para facilitar CRUD';
COMMENT ON COLUMN categoria_opcoes.id_categoria IS 'ID da categoria a qual esta opção pertence';
COMMENT ON COLUMN categoria_opcoes.nome IS 'Nome da opção (ex: Pequeno, Médio, Grande)';
COMMENT ON COLUMN categoria_opcoes.status IS 'Status da opção (1=ativo, 0=inativo)';
COMMENT ON COLUMN categoria_opcoes.deleted_at IS 'Data e hora de exclusão lógica (soft delete)';

-- Índices para otimizar consultas (incluindo filtro para registros não excluídos)
CREATE INDEX idx_categorias_tenant ON categorias(id_tenant) WHERE deleted_at IS NULL;
CREATE INDEX idx_categorias_culinaria ON categorias(id_culinaria) WHERE deleted_at IS NULL;
CREATE INDEX idx_categorias_ativo ON categorias(ativo) WHERE deleted_at IS NULL;
CREATE INDEX idx_categorias_deleted_at ON categorias(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_categoria_opcoes_categoria ON categoria_opcoes(id_categoria) WHERE deleted_at IS NULL;
CREATE INDEX idx_categoria_opcoes_status ON categoria_opcoes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_categoria_opcoes_deleted_at ON categoria_opcoes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Função de trigger para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar automaticamente o campo updated_at
CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON categorias
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categoria_opcoes_updated_at
BEFORE UPDATE ON categoria_opcoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Funções para soft delete
CREATE OR REPLACE FUNCTION soft_delete_record()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Views para facilitar consultas apenas de registros ativos (não excluídos)
CREATE VIEW categorias_view AS
    SELECT * FROM categorias WHERE deleted_at IS NULL;

CREATE VIEW categoria_opcoes_view AS
    SELECT * FROM categoria_opcoes WHERE deleted_at IS NULL;
---- create above / drop below ----
DROP VIEW IF EXISTS categoria_opcoes_view;
DROP VIEW IF EXISTS categorias_view;

DROP FUNCTION IF EXISTS soft_delete_record();

DROP TRIGGER IF EXISTS update_categoria_opcoes_updated_at ON categoria_opcoes;
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;

DROP FUNCTION IF EXISTS update_updated_at();

DROP INDEX IF EXISTS idx_categoria_opcoes_deleted_at;
DROP INDEX IF EXISTS idx_categoria_opcoes_status;
DROP INDEX IF EXISTS idx_categoria_opcoes_categoria;

DROP INDEX IF EXISTS idx_categorias_deleted_at;
DROP INDEX IF EXISTS idx_categorias_ativo;
DROP INDEX IF EXISTS idx_categorias_culinaria;
DROP INDEX IF EXISTS idx_categorias_tenant;


-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
