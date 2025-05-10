interface Produto {
  id: string; // uuid
  codigo: number;
  codigo_ext: string | null;
  tenant_id: string; // uuid
  representada_id: string; // uuid
  grupo_id: string | null; // uuid opcional
  tipo: string | null;
  nome: string | null;
  especificacao: string | null;
  volume: number | null;
  unidade: string | null;
  comprimento: number | null;
  largura: number | null;
  altura: number | null;
  peso_liquido: number | null;
  preco1: number | null;
  preco2: number | null;
  preco3: number | null;
  preco4: number | null;
  preco5: number | null;
  preco6: number | null;
  preco7: number | null;
  preco8: number | null;
  preco9: number | null;
  preco10: number | null;
  preco11: number | null;
  preco12: number | null;
  preco13: number | null;
  preco14: number | null;
  preco15: number | null;
  preco16: number | null;
  preco17: number | null;
  preco18: number | null;
  preco19: number | null;
  preco20: number | null;
  preco21: number | null;
  preco22: number | null;
  preco23: number | null;
  preco24: number | null;
  comiss1: number | null;
  comiss2: number | null;
  comiss3: number | null;
  comiss4: number | null;
  comiss5: number | null;
  comiss6: number | null;
  comiss7: number | null;
  comiss8: number | null;
  comiss9: number | null;
  comiss10: number | null;
  comiss11: number | null;
  comiss12: number | null;
  comiss13: number | null;
  comiss14: number | null;
  comiss15: number | null;
  comiss16: number | null;
  comiss17: number | null;
  comiss18: number | null;
  comiss19: number | null;
  comiss20: number | null;
  comiss21: number | null;
  comiss22: number | null;
  comiss23: number | null;
  comiss24: number | null;
  created_at: string | null;
  updated_at: string | null;
  grupo_nome: string;
  subgrupo_nome: string;
  representada_nome: string;
  descricao: string | null;
  qtde_por_caixa: number | null;
}

// Para exportação
export type { Produto };
