import axios, { AxiosInstance, AxiosResponse } from "axios";

// Interfaces for Produto DTOs
interface CreateProdutoPrecoRequestDTO {
  id_categoria_opcao: string;
  codigo_externo_opcao_preco?: string;
  preco_base: string;
  preco_promocional?: string;
  disponivel: 0 | 1;
}

interface CreateProdutoRequest {
  id_categoria: string;
  nome: string;
  descricao?: string;
  codigo_externo?: string;
  sku?: string;
  permite_observacao?: boolean;
  ordem?: number;
  imagem_url?: string;
  status: 0 | 1;
  precos?: CreateProdutoPrecoRequestDTO[];
}

interface UpdateProdutoRequest extends CreateProdutoRequest {
  // Same fields as CreateProdutoRequest, all required except for optional fields
}

interface ProdutoPrecoResponse {
  id: string;
  seq_id: number;
  id_produto: string;
  id_categoria_opcao: string;
  nome_opcao?: string;
  codigo_externo_opcao_preco?: string;
  preco_base: string;
  preco_promocional?: string;
  disponivel: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface ProdutoResponse {
  id: string;
  seq_id: number;
  id_categoria: string;
  nome: string;
  descricao?: string;
  codigo_externo?: string;
  sku?: string;
  permite_observacao?: boolean;
  ordem?: number;
  imagem_url?: string;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  precos?: ProdutoPrecoResponse[];
}

interface ProdutoListResponse {
  produtos: ProdutoResponse[];
  total_count: number;
  limit: number;
  offset: number;
}

interface UpdateProdutoStatusRequest {
  status: 0 | 1;
}

interface UpdateProdutoOrdemRequest {
  ordem: number;
}

interface CreateProdutoPrecoRequest {
  id_produto: string;
  id_categoria_opcao: string;
  codigo_externo_opcao_preco?: string;
  preco_base: string;
  preco_promocional?: string;
  disponivel: 0 | 1;
}

interface UpdateProdutoPrecoRequest {
  id_categoria_opcao: string;
  codigo_externo_opcao_preco?: string;
  preco_base: string;
  preco_promocional?: string;
  disponivel: 0 | 1;
}

interface UpdateProdutoPrecoDisponibilidadeRequest {
  disponivel: 0 | 1;
}

// Error response interface for API errors
interface ApiError {
  error: string;
}

// Validation problems interface (returned on 400 Bad Request)
interface ValidationProblem {
  [key: string]: any;
}

export type {
  CreateProdutoPrecoRequestDTO,
  CreateProdutoRequest,
  UpdateProdutoRequest,
  ProdutoPrecoResponse,
  ProdutoResponse,
  ProdutoListResponse,
  UpdateProdutoStatusRequest,
  UpdateProdutoOrdemRequest,
  CreateProdutoPrecoRequest,
  UpdateProdutoPrecoRequest,
  UpdateProdutoPrecoDisponibilidadeRequest,
};

export class ProdutoService {
  private api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  // GET /produtos
  public async listProdutos(
    idCategoria?: string,
    limit: number = 20,
    offset: number = 0,
    nome?: string
  ): Promise<ProdutoListResponse> {
    try {
      const response: AxiosResponse<ProdutoListResponse> = await this.api.get(
        "/produtos",
        {
          params: {
            id_categoria: idCategoria,
            limit,
            offset,
            nome,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /produtos/{id}
  public async getProduto(id: string): Promise<ProdutoResponse> {
    try {
      const response: AxiosResponse<ProdutoResponse> = await this.api.get(
        `/produtos/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /produtos
  public async createProduto(
    data: CreateProdutoRequest
  ): Promise<ProdutoResponse> {
    try {
      const response: AxiosResponse<ProdutoResponse> = await this.api.post(
        "/produtos",
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /produtos/{id}
  public async updateProduto(
    id: string,
    data: UpdateProdutoRequest
  ): Promise<ProdutoResponse> {
    try {
      const response: AxiosResponse<ProdutoResponse> = await this.api.put(
        `/produtos/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE /produtos/{id}
  public async deleteProduto(id: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> =
        await this.api.delete(`/produtos/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /produtos/{id}/status
  public async updateProdutoStatus(
    id: string,
    data: UpdateProdutoStatusRequest
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.put(
        `/produtos/${id}/status`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /produtos/{id}/ordem
  public async updateProdutoOrdem(
    id: string,
    data: UpdateProdutoOrdemRequest
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.put(
        `/produtos/${id}/ordem`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /produtos/{id}/precos
  public async createProdutoPreco(
    id: string,
    data: CreateProdutoPrecoRequest
  ): Promise<ProdutoPrecoResponse> {
    try {
      const response: AxiosResponse<ProdutoPrecoResponse> = await this.api.post(
        `/produtos/${id}/precos`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /produtos/{id}/precos/{precoId}
  public async updateProdutoPreco(
    id: string,
    precoId: string,
    data: UpdateProdutoPrecoRequest
  ): Promise<ProdutoPrecoResponse> {
    try {
      const response: AxiosResponse<ProdutoPrecoResponse> = await this.api.put(
        `/produtos/${id}/precos/${precoId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE /produtos/{id}/precos/{precoId}
  public async deleteProdutoPreco(
    id: string,
    precoId: string
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> =
        await this.api.delete(`/produtos/${id}/precos/${precoId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /produtos/{id}/precos/{precoId}/disponibilidade
  public async updateProdutoPrecoDisponibilidade(
    id: string,
    precoId: string,
    data: UpdateProdutoPrecoDisponibilidadeRequest
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.put(
        `/produtos/${id}/precos/${precoId}/disponibilidade`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiError | ValidationProblem;

      if (status === 400 && "error" in data) {
        return new Error(`Bad Request: ${data.error}`);
      } else if (status === 400) {
        return new Error(`Validation Error: ${JSON.stringify(data)}`);
      } else if (status === 401) {
        return new Error("Unauthorized: Invalid or missing authentication");
      } else if (status === 403) {
        return new Error("Forbidden: Access denied");
      } else if (status === 404) {
        return new Error(`Not Found: ${data.error || "Resource not found"}`);
      } else if (status === 409) {
        return new Error(`Conflict: ${data.error || "Resource conflict"}`);
      } else {
        return new Error(
          `Server Error: ${data.error || "Internal server error"}`
        );
      }
    } else if (error.request) {
      return new Error("Network Error: No response received from server");
    } else {
      return new Error(`Request Error: ${error.message}`);
    }
  }
}

// Usage example:
/*
const produtoService = new ProdutoService(axiosInstance);

// List products
produtoService.listProdutos('some-category-id', 20, 0).then(response => {
  console.log(response.produtos);
}).catch(error => {
  console.error(error.message);
});

// Create a product
const newProduto: CreateProdutoRequest = {
  id_categoria: 'uuid-of-category',
  nome: 'New Product',
  status: 1,
  precos: [
    {
      id_categoria_opcao: 'uuid-of-option',
      preco_base: '10.99',
      disponivel: 1,
    },
  ],
};
produtoService.createProduto(newProduto).then(response => {
  console.log(response);
}).catch(error => {
  console.error(error.message);
});
*/
