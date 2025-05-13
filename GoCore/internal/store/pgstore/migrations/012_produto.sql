-- Write your migrate up statements here
-- -----------------------------------------------------
-- Tabela public.produtos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_id BIGSERIAL UNIQUE,
  id_categoria UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  codigo_externo VARCHAR(100), -- Código utilizado pelo sistema externo/integração para este produto
  sku VARCHAR(100), -- Stock Keeping Unit, se aplicável
  permite_observacao BOOLEAN DEFAULT TRUE,
  ordem INTEGER, -- Ordem de exibição do produto dentro da categoria
  imagem_url VARCHAR(2048), -- URL para a imagem principal do produto
  status SMALLINT NOT NULL DEFAULT 1, -- Status do produto (1=ativo, 0=inativo)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_produtos_categorias
    FOREIGN KEY (id_categoria)
    REFERENCES public.categorias (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

COMMENT ON TABLE public.produtos
  IS 'Armazena os produtos do cardápio, vinculados a uma categoria.';
COMMENT ON COLUMN public.produtos.id
  IS 'Identificador único UUID do produto.';
COMMENT ON COLUMN public.produtos.seq_id
  IS 'Identificador sequencial único do produto (para facilitar CRUD e referência legada se necessário).';
COMMENT ON COLUMN public.produtos.id_categoria
  IS 'Referência à categoria à qual o produto pertence (FK para public.categorias.id).';
COMMENT ON COLUMN public.produtos.nome
  IS 'Nome do produto exibido no cardápio.';
COMMENT ON COLUMN public.produtos.descricao
  IS 'Descrição detalhada do produto.';
COMMENT ON COLUMN public.produtos.codigo_externo
  IS 'Código externo do produto, utilizado para identificação em integrações ou sistemas legados.';
COMMENT ON COLUMN public.produtos.sku
  IS 'SKU (Stock Keeping Unit) do produto, para controle de inventário se aplicável.';
COMMENT ON COLUMN public.produtos.permite_observacao
  IS 'Indica se o cliente pode adicionar observações a este produto no pedido (TRUE/FALSE).';
COMMENT ON COLUMN public.produtos.ordem
  IS 'Define a ordem de exibição deste produto dentro de sua categoria no cardápio.';
COMMENT ON COLUMN public.produtos.imagem_url
  IS 'URL da imagem principal associada ao produto.';
COMMENT ON COLUMN public.produtos.status
  IS 'Status do produto (1 = ativo, 0 = inativo).';
COMMENT ON COLUMN public.produtos.created_at
  IS 'Timestamp da criação do registro do produto.';
COMMENT ON COLUMN public.produtos.updated_at
  IS 'Timestamp da última atualização do registro do produto.';
COMMENT ON COLUMN public.produtos.deleted_at
  IS 'Timestamp da exclusão lógica do produto (soft delete).';

-- Índices para a tabela produtos
CREATE INDEX IF NOT EXISTS idx_produtos_id_categoria ON public.produtos (id_categoria) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_externo ON public.produtos (codigo_externo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_status ON public.produtos (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_deleted_at ON public.produtos (deleted_at) WHERE deleted_at IS NOT NULL;

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER trigger_produtos_update_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.produtos OWNER TO "ADM";


-- -----------------------------------------------------
-- Tabela public.produto_precos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produto_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_id BIGSERIAL UNIQUE,
  id_produto UUID NOT NULL,
  id_categoria_opcao UUID NOT NULL, -- Referencia a opção da categoria (ex: Tamanho P, M, G)
  codigo_externo_opcao_preco VARCHAR(100), -- Código utilizado pelo sistema externo/integração para esta variação de preço
  preco_base NUMERIC(10, 2) NOT NULL,
  preco_promocional NUMERIC(10, 2),
  disponivel SMALLINT NOT NULL DEFAULT 1, -- Status da opção de preço (1=disponível, 0=indisponível)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_produto_precos_produto
    FOREIGN KEY (id_produto)
    REFERENCES public.produtos (id)
    ON DELETE CASCADE -- Se o produto for excluído, seus preços associados também são.
    ON UPDATE CASCADE,
  CONSTRAINT fk_produto_precos_categoria_opcao
    FOREIGN KEY (id_categoria_opcao)
    REFERENCES public.categoria_opcoes (id)
    ON DELETE RESTRICT -- Impede a exclusão de uma categoria_opcao se ela estiver em uso.
    ON UPDATE CASCADE
);

COMMENT ON TABLE public.produto_precos
  IS 'Armazena as variações de preço para cada produto, baseadas nas opções de categoria.';
COMMENT ON COLUMN public.produto_precos.id
  IS 'Identificador único UUID para a entrada de preço.';
COMMENT ON COLUMN public.produto_precos.seq_id
  IS 'Identificador sequencial único para a entrada de preço (para facilitar CRUD e referência legada se necessário).';
COMMENT ON COLUMN public.produto_precos.id_produto
  IS 'Referência ao produto ao qual este preço pertence (FK para public.produtos.id).';
COMMENT ON COLUMN public.produto_precos.id_categoria_opcao
  IS 'Referência à opção da categoria que define esta variação de preço (FK para public.categoria_opcoes.id). Ex: "Pequeno", "Médio".';
COMMENT ON COLUMN public.produto_precos.codigo_externo_opcao_preco
  IS 'Código externo para esta variação de preço específica (ex: "PEQUENO_COPO_ACAI"). Mapeia para o campo "codigo" dentro do array "opcoes" no JSON do produto.';
COMMENT ON COLUMN public.produto_precos.preco_base
  IS 'O preço regular desta opção do produto.';
COMMENT ON COLUMN public.produto_precos.preco_promocional
  IS 'O preço promocional desta opção do produto, se aplicável. Corresponde a "valor2" ou "valorAtual" no JSON.';
COMMENT ON COLUMN public.produto_precos.disponivel
  IS 'Status desta opção de preço (1 = disponível, 0 = indisponível). Corresponde ao campo "status" dentro do array "opcoes" no JSON do produto.';
COMMENT ON COLUMN public.produto_precos.created_at
  IS 'Timestamp da criação do registro de preço.';
COMMENT ON COLUMN public.produto_precos.updated_at
  IS 'Timestamp da última atualização do registro de preço.';
COMMENT ON COLUMN public.produto_precos.deleted_at
  IS 'Timestamp da exclusão lógica do preço (soft delete).';

-- Índices para a tabela produto_precos
CREATE INDEX IF NOT EXISTS idx_produto_precos_id_produto ON public.produto_precos (id_produto) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_precos_id_categoria_opcao ON public.produto_precos (id_categoria_opcao) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_precos_codigo_externo_opcao_preco ON public.produto_precos (codigo_externo_opcao_preco) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_precos_disponivel ON public.produto_precos (disponivel) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produto_precos_deleted_at ON public.produto_precos (deleted_at) WHERE deleted_at IS NOT NULL;

-- Constraint de unicidade para garantir que um produto não tenha o mesmo preço para a mesma opção de categoria (ativa)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_produto_precos_produto_opcao_ativo
  ON public.produto_precos (id_produto, id_categoria_opcao)
  WHERE (deleted_at IS NULL);

-- (Opcional) Constraint de unicidade para o código externo da opção de preço por produto ativo, se necessário.
-- Considere que codigo_externo_opcao_preco pode ser nulo ou vazio.
-- CREATE UNIQUE INDEX IF NOT EXISTS uidx_produto_precos_produto_codigo_externo_ativo
--   ON public.produto_precos (id_produto, codigo_externo_opcao_preco)
--   WHERE (deleted_at IS NULL AND codigo_externo_opcao_preco IS NOT NULL AND codigo_externo_opcao_preco != '');

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER trigger_produto_precos_update_updated_at
  BEFORE UPDATE ON public.produto_precos
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.produto_precos OWNER TO "ADM";
---- create above / drop below ----
-- Reversão para a tabela public.produto_precos
-- O comando DROP TABLE também removerá automaticamente índices, triggers e constraints associados a esta tabela.
DROP TABLE IF EXISTS public.produto_precos;

-- Reversão para a tabela public.produtos
-- O comando DROP TABLE também removerá automaticamente índices, triggers e constraints associados a esta tabela.
DROP TABLE IF EXISTS public.produtos;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
