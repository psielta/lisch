// Interfaces TypeScript correspondentes aos DTOs do backend Go

/**
 * Interface para representar uma opção de categoria.
 * Corresponde a CategoriaOpcaoItem no backend.
 */
export interface ICategoriaOpcao {
  id: string;
  seq_id: number;
  id_categoria: string;
  nome: string;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Interface principal para representar uma categoria com suas opções.
 * Corresponde a CoreCategoriaResponseDTO no backend.
 */
export interface ICoreCategoria {
  id: string;
  seq_id: number;
  id_tenant: string;
  id_culinaria: number;
  nome: string;
  descricao?: string;
  inicio: string;
  fim: string;
  ativo: number;
  opcao_meia: string;
  ordem?: number;
  disponivel_domingo: number;
  disponivel_segunda: number;
  disponivel_terca: number;
  disponivel_quarta: number;
  disponivel_quinta: number;
  disponivel_sexta: number;
  disponivel_sabado: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tipo_visualizacao?: number;
  opcoes: ICategoriaOpcao[];
}

/**
 * Interface para criação de uma nova categoria.
 * Corresponde a CoreCategoriaCreateDTO no backend.
 */
export interface ICoreCategoriaCreate {
  id_tenant: string;
  id_culinaria: number;
  nome: string;
  descricao?: string;
  inicio?: string;
  fim?: string;
  ativo?: number;
  opcao_meia?: string;
  ordem?: number;
  disponivel_domingo?: number;
  disponivel_segunda?: number;
  disponivel_terca?: number;
  disponivel_quarta?: number;
  disponivel_quinta?: number;
  disponivel_sexta?: number;
  disponivel_sabado?: number;
  tipo_visualizacao?: number;
  opcoes: {
    nome: string;
    status?: number;
  }[];
}

/**
 * Interface para atualização de uma categoria existente.
 * Corresponde a CoreCategoriaUpdateDTO no backend.
 */
export interface ICoreCategoriaUpdate {
  id: string;
  id_culinaria: number;
  nome: string;
  descricao?: string;
  inicio?: string;
  fim?: string;
  ativo?: number;
  opcao_meia?: string;
  ordem?: number;
  disponivel_domingo?: number;
  disponivel_segunda?: number;
  disponivel_terca?: number;
  disponivel_quarta?: number;
  disponivel_quinta?: number;
  disponivel_sexta?: number;
  disponivel_sabado?: number;
  tipo_visualizacao?: number;
  opcoes: {
    id?: string;
    nome: string;
    status?: number;
  }[];
}

/**
 * Interface para atualização de status de uma opção de categoria.
 * Corresponde a CategoriaOpcaoStatusUpdateDTO no backend.
 */
export interface ICategoriaOpcaoStatusUpdate {
  id: string;
  id_categoria: string;
  status: number;
}

/**
 * Interface para atualização de status de uma categoria.
 * Corresponde a CategoriaStatusUpdateDTO no backend.
 */
export interface ICategoriaStatusUpdate {
  id: string;
  ativo: number;
}

/**
 * Interface para atualização da ordem de uma categoria.
 * Corresponde a CategoriaOrdemUpdateDTO no backend.
 */
export interface ICategoriaOrdemUpdate {
  id: string;
  ordem: number;
}
