export interface ProdutoEstoque {
  id: string; // UUID
  produto_id: string; // UUID
  tenant_id: string; // UUID
  deposito_id: string; // UUID
  quantidade: number; // NUMERIC(15,2)
  reservado: number; // NUMERIC(15,2) com valor padrão 0
  updated_at: string; // TIMESTAMP WITH TIME ZONE
  deposito_nome: string;
  produto_nome: string;
  produto_codigo_ext: string;
  produto_codigo: number;
}
