// utils/merge-utils.ts
import {
  CategoriaAdicionalResponse,
  CategoriaAdicionalOpcaoResponse,
} from "@/rxjs/adicionais/categoria-adicional.model";
import {
  ICoreCategoria,
  ICategoriaOpcao,
} from "@/rxjs/categoria/categoria.model";
import {
  ProdutoResponse,
  ProdutoPrecoResponse,
} from "@/rxjs/produto/produto.model";

/**
 * Função genérica para fazer merge de arrays baseado em uma chave única (geralmente 'id')
 * @param existingArray Array existente
 * @param newArray Array com novos itens para fazer merge
 * @param key Chave para comparação (padrão: 'id')
 * @returns Array combinado sem duplicatas
 */
function mergeArraysById<T extends Record<string, any>>(
  existingArray: T[],
  newArray: T[],
  key: keyof T = "id"
): T[] {
  const existingIds = new Set(existingArray.map((item) => item[key]));
  const uniqueNewItems = newArray.filter((item) => !existingIds.has(item[key]));
  return [...existingArray, ...uniqueNewItems];
}

/**
 * Merge de produtos com seus preços aninhados
 * @param existingProdutos Array de produtos existentes
 * @param newProdutos Array de produtos novos (do pedido)
 * @returns Array de produtos combinado sem duplicatas
 */
export function mergeProdutos(
  existingProdutos: ProdutoResponse[],
  newProdutos: ProdutoResponse[]
): ProdutoResponse[] {
  // Primeiro, criar um mapa dos produtos existentes para fácil acesso
  const existingProdutosMap = new Map<string, ProdutoResponse>();
  existingProdutos.forEach((produto) => {
    existingProdutosMap.set(produto.id, produto);
  });

  // Processar produtos novos
  const mergedProdutos: ProdutoResponse[] = [...existingProdutos];

  newProdutos.forEach((newProduto) => {
    if (!existingProdutosMap.has(newProduto.id)) {
      // Produto não existe, adicionar diretamente
      mergedProdutos.push(newProduto);
    } else {
      // Produto já existe, fazer merge dos preços
      const existingProduto = existingProdutosMap.get(newProduto.id)!;
      const existingPrecos = existingProduto.precos || [];
      const newPrecos = newProduto.precos || [];

      // Merge dos preços sem duplicação
      const mergedPrecos = mergeArraysById(existingPrecos, newPrecos);

      // Atualizar o produto existente com preços combinados
      const produtoIndex = mergedProdutos.findIndex(
        (p) => p.id === newProduto.id
      );
      if (produtoIndex !== -1) {
        mergedProdutos[produtoIndex] = {
          ...mergedProdutos[produtoIndex],
          precos: mergedPrecos,
        };
      }
    }
  });

  return mergedProdutos;
}

/**
 * Merge de categorias com suas opções aninhadas
 * @param existingCategorias Array de categorias existentes
 * @param newCategorias Array de categorias novas (do pedido)
 * @returns Array de categorias combinado sem duplicatas
 */
export function mergeCategorias(
  existingCategorias: ICoreCategoria[],
  newCategorias: ICoreCategoria[]
): ICoreCategoria[] {
  // Criar mapa das categorias existentes
  const existingCategoriasMap = new Map<string, ICoreCategoria>();
  existingCategorias.forEach((categoria) => {
    existingCategoriasMap.set(categoria.id, categoria);
  });

  const mergedCategorias: ICoreCategoria[] = [...existingCategorias];

  newCategorias.forEach((newCategoria) => {
    if (!existingCategoriasMap.has(newCategoria.id)) {
      // Categoria não existe, adicionar diretamente
      mergedCategorias.push(newCategoria);
    } else {
      // Categoria já existe, fazer merge das opções
      const existingCategoria = existingCategoriasMap.get(newCategoria.id)!;
      const existingOpcoes = existingCategoria.opcoes || [];
      const newOpcoes = newCategoria.opcoes || [];

      // Merge das opções sem duplicação
      const mergedOpcoes = mergeArraysById(existingOpcoes, newOpcoes);

      // Atualizar a categoria existente com opções combinadas
      const categoriaIndex = mergedCategorias.findIndex(
        (c) => c.id === newCategoria.id
      );
      if (categoriaIndex !== -1) {
        mergedCategorias[categoriaIndex] = {
          ...mergedCategorias[categoriaIndex],
          opcoes: mergedOpcoes,
        };
      }
    }
  });

  return mergedCategorias;
}

/**
 * Merge de adicionais com suas opções aninhadas
 * @param existingAdicionais Array de adicionais existentes
 * @param newAdicionais Array de adicionais novos (do pedido)
 * @returns Array de adicionais combinado sem duplicatas
 */
export function mergeAdicionais(
  existingAdicionais: CategoriaAdicionalResponse[],
  newAdicionais: CategoriaAdicionalResponse[]
): CategoriaAdicionalResponse[] {
  // Criar mapa dos adicionais existentes
  const existingAdicionaisMap = new Map<string, CategoriaAdicionalResponse>();
  existingAdicionais.forEach((adicional) => {
    existingAdicionaisMap.set(adicional.id, adicional);
  });

  const mergedAdicionais: CategoriaAdicionalResponse[] = [
    ...existingAdicionais,
  ];

  newAdicionais.forEach((newAdicional) => {
    if (!existingAdicionaisMap.has(newAdicional.id)) {
      // Adicional não existe, adicionar diretamente
      mergedAdicionais.push(newAdicional);
    } else {
      // Adicional já existe, fazer merge das opções
      const existingAdicional = existingAdicionaisMap.get(newAdicional.id)!;
      const existingOpcoes = existingAdicional.opcoes || [];
      const newOpcoes = newAdicional.opcoes || [];

      // Merge das opções sem duplicação
      const mergedOpcoes = mergeArraysById(existingOpcoes, newOpcoes);

      // Atualizar o adicional existente com opções combinadas
      const adicionalIndex = mergedAdicionais.findIndex(
        (a) => a.id === newAdicional.id
      );
      if (adicionalIndex !== -1) {
        mergedAdicionais[adicionalIndex] = {
          ...mergedAdicionais[adicionalIndex],
          opcoes: mergedOpcoes,
        };
      }
    }
  });

  return mergedAdicionais;
}

/**
 * Função principal para fazer merge completo de todos os dados do pedido
 * @param existingData Dados existentes (ativos)
 * @param pedidoData Dados do pedido (incluindo soft-deleted)
 * @returns Dados combinados sem duplicatas
 */
export function mergePedidoData(
  existingData: {
    produtos: ProdutoResponse[];
    categorias: ICoreCategoria[];
    adicionais: CategoriaAdicionalResponse[];
  },
  pedidoData: {
    produtos: ProdutoResponse[];
    categorias: ICoreCategoria[];
    adicionais: CategoriaAdicionalResponse[];
  }
) {
  return {
    produtos: mergeProdutos(existingData.produtos, pedidoData.produtos),
    categorias: mergeCategorias(existingData.categorias, pedidoData.categorias),
    adicionais: mergeAdicionais(existingData.adicionais, pedidoData.adicionais),
  };
}

/**
 * Função de utilidade para debug - mostra estatísticas do merge
 * @param beforeData Dados antes do merge
 * @param afterData Dados depois do merge
 */
export function logMergeStats(
  beforeData: { produtos: any[]; categorias: any[]; adicionais: any[] },
  afterData: { produtos: any[]; categorias: any[]; adicionais: any[] }
) {
  console.log("📊 Merge Statistics:");
  console.log(
    `Produtos: ${beforeData.produtos.length} → ${afterData.produtos.length} (+${
      afterData.produtos.length - beforeData.produtos.length
    })`
  );
  console.log(
    `Categorias: ${beforeData.categorias.length} → ${
      afterData.categorias.length
    } (+${afterData.categorias.length - beforeData.categorias.length})`
  );
  console.log(
    `Adicionais: ${beforeData.adicionais.length} → ${
      afterData.adicionais.length
    } (+${afterData.adicionais.length - beforeData.adicionais.length})`
  );
}
