import axios, { AxiosInstance, AxiosResponse } from "axios";

// Interfaces for Pedido DTOs
interface PedidoItemAdicionalDTO {
  id_adicional_opcao: string;
  valor: string;
  quantidade: number;
}

interface PedidoItemDTO {
  id_categoria: string;
  id_categoria_opcao?: string;
  id_produto: string;
  id_produto_2?: string;
  observacao?: string;
  valor_unitario: string;
  quantidade: number;
  adicionais?: PedidoItemAdicionalDTO[];
}

interface PedidoStatusDTO {
  id: number;
  descricao: string;
}

interface PedidoClienteDTO {
  id: string;
  tenant_id: string;
  tipo_pessoa: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  ie?: string;
  im?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  created_at: string;
  updated_at: string;
}

interface PedidoItemAdicionalFullDTO {
  id: string;
  seq_id: number;
  id_pedido_item: string;
  id_adicional_opcao: string;
  valor: string;
  quantidade: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface PedidoItemResponseDTO {
  id: string;
  seq_id: number;
  id_pedido: string;
  id_produto: string;
  id_produto_2?: string;
  id_categoria: string;
  id_categoria_opcao?: string;
  observacao?: string;
  valor_unitario: string;
  quantidade: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  adicionais: PedidoItemAdicionalFullDTO[];
}

interface CreatePedidoRequest {
  tenant_id: string;
  id_cliente: string;
  codigo_pedido: string;
  data_pedido: string;
  gmt: number;
  cupom?: string;
  tipo_entrega: "Delivery" | "Retirada";
  prazo?: number;
  prazo_min?: number;
  prazo_max?: number;
  categoria_pagamento?: string;
  forma_pagamento?: string;
  valor_total: string;
  observacao?: string;
  taxa_entrega: string;
  nome_taxa_entrega?: string;
  id_status: number;
  lat?: string;
  lng?: string;
  itens: PedidoItemDTO[];
}

interface UpdatePedidoRequest extends CreatePedidoRequest {
  id: string;
}

interface PedidoResponse {
  id: string;
  seq_id: number;
  tenant_id: string;
  id_cliente: string;
  codigo_pedido: string;
  data_pedido: string;
  gmt: number;
  pedido_pronto: number;
  data_pedido_pronto?: string;
  cupom?: string;
  tipo_entrega: string;
  prazo?: number;
  prazo_min?: number;
  prazo_max?: number;
  categoria_pagamento?: string;
  forma_pagamento?: string;
  valor_total: string;
  observacao?: string;
  taxa_entrega: string;
  nome_taxa_entrega?: string;
  id_status: number;
  lat?: string;
  lng?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  valor_pago: string;
  quitado?: boolean;
  status: PedidoStatusDTO;
  cliente: PedidoClienteDTO;
  itens: PedidoItemResponseDTO[];
}

interface PedidoListResponse {
  pedidos: PedidoResponse[];
  total: number;
  limit: number;
  offset: number;
}

interface UpdatePedidoStatusRequest {
  id_status: number;
}

interface UpdatePedidoProntoRequest {
  pedido_pronto: 0 | 1;
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
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
  PedidoStatusDTO,
  PedidoClienteDTO,
  PedidoItemAdicionalFullDTO,
  PedidoItemResponseDTO,
  CreatePedidoRequest,
  UpdatePedidoRequest,
  PedidoResponse,
  PedidoListResponse,
  UpdatePedidoStatusRequest,
  UpdatePedidoProntoRequest,
};

export class PedidoService {
  private api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  // GET /pedidos
  public async listPedidos(
    idCliente?: string,
    status?: string,
    tipoEntrega?: "Delivery" | "Retirada",
    dataInicio?: string,
    dataFim?: string,
    codigoPedido?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PedidoListResponse> {
    try {
      const response: AxiosResponse<PedidoListResponse> = await this.api.get(
        "/pedidos",
        {
          params: {
            id_cliente: idCliente,
            status,
            tipo_entrega: tipoEntrega,
            data_inicio: dataInicio,
            data_fim: dataFim,
            codigo_pedido: codigoPedido,
            limit,
            offset,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /pedidos/count
  public async countPedidos(
    idCliente?: string,
    status?: string,
    tipoEntrega?: "Delivery" | "Retirada",
    dataInicio?: string,
    dataFim?: string,
    codigoPedido?: string
  ): Promise<{ count: number }> {
    try {
      const response: AxiosResponse<{ count: number }> = await this.api.get(
        "/pedidos/count",
        {
          params: {
            id_cliente: idCliente,
            status,
            tipo_entrega: tipoEntrega,
            data_inicio: dataInicio,
            data_fim: dataFim,
            codigo_pedido: codigoPedido,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /pedidos/{id}
  public async getPedido(id: string): Promise<PedidoResponse> {
    try {
      const response: AxiosResponse<PedidoResponse> = await this.api.get(
        `/pedidos/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /pedidos/codigo/{codigo}
  public async getPedidoByCodigo(codigo: string): Promise<PedidoResponse> {
    try {
      const response: AxiosResponse<PedidoResponse> = await this.api.get(
        `/pedidos/codigo/${codigo}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /pedidos
  public async createPedido(
    data: CreatePedidoRequest
  ): Promise<PedidoResponse> {
    try {
      const response: AxiosResponse<PedidoResponse> = await this.api.post(
        "/pedidos",
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /pedidos/{id}
  public async updatePedido(
    id: string,
    data: UpdatePedidoRequest
  ): Promise<PedidoResponse> {
    try {
      const response: AxiosResponse<PedidoResponse> = await this.api.put(
        `/pedidos/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE /pedidos/{id}
  public async deletePedido(id: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> =
        await this.api.delete(`/pedidos/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /pedidos/{id}/status
  public async updatePedidoStatus(
    id: string,
    data: UpdatePedidoStatusRequest
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.put(
        `/pedidos/${id}/status`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /pedidos/{id}/pedido-pronto
  public async updatePedidoPronto(
    id: string,
    data: UpdatePedidoProntoRequest
  ): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.put(
        `/pedidos/${id}/pedido-pronto`,
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
