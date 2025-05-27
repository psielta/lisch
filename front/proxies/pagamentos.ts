import axios, { AxiosInstance, AxiosResponse } from "axios";

// === Pedido Pagamentos DTOs ===
interface PedidoPagamentoCreateDTO {
  id_pedido: string;
  id_conta_receber?: string;
  categoria_pagamento?: string;
  forma_pagamento: string;
  valor_pago: string;
  troco: string;
  observacao?: string;
}

interface PedidoPagamentoResponseDTO {
  id: string;
  seq_id: number;
  id_pedido: string;
  id_conta_receber?: string;
  categoria_pagamento?: string;
  forma_pagamento: string;
  valor_pago: string;
  troco?: string;
  autorizado_por?: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface PedidoPagamentoBulkDTO extends Array<PedidoPagamentoCreateDTO> {}

// === Contas Receber DTOs ===
interface ContasReceberCreateDTO {
  id_pedido: string;
  parcela: number;
  vencimento: string; // Format: YYYY-MM-DD
  valor_devido: string;
}

interface ContasReceberResponseDTO {
  id: string;
  id_pedido: string;
  parcela: number;
  vencimento: string;
  valor_devido: string;
  valor_pago?: string;
  quitado?: boolean;
  created_at: string;
  updated_at: string;
}

interface ContasReceberBulkDTO extends Array<ContasReceberCreateDTO> {}

// Error response interface for API errors
interface ApiError {
  error: string;
}

// Validation problems interface (returned on 400 Bad Request)
interface ValidationProblem {
  [key: string]: any;
}

export type {
  PedidoPagamentoCreateDTO,
  PedidoPagamentoResponseDTO,
  PedidoPagamentoBulkDTO,
  ContasReceberCreateDTO,
  ContasReceberResponseDTO,
  ContasReceberBulkDTO,
};

export class PagamentoContasService {
  private api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  // === Pedido Pagamentos Methods ===

  // GET /pedido-pagamentos
  public async listPedidoPagamentos(
    idPedido: string
  ): Promise<PedidoPagamentoResponseDTO[]> {
    try {
      const response: AxiosResponse<PedidoPagamentoResponseDTO[]> =
        await this.api.get("/pedido-pagamentos", {
          params: { id_pedido: idPedido },
        });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /pedido-pagamentos
  public async createPedidoPagamento(
    data: PedidoPagamentoCreateDTO
  ): Promise<PedidoPagamentoResponseDTO> {
    try {
      const response: AxiosResponse<PedidoPagamentoResponseDTO> =
        await this.api.post("/pedido-pagamentos", data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /pedido-pagamentos/bulk
  public async createBulkPedidoPagamentos(
    data: PedidoPagamentoBulkDTO
  ): Promise<PedidoPagamentoResponseDTO[]> {
    try {
      const response: AxiosResponse<PedidoPagamentoResponseDTO[]> =
        await this.api.post("/pedido-pagamentos/bulk", data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE /pedido-pagamentos/{id}
  public async deletePedidoPagamento(id: string): Promise<void> {
    try {
      await this.api.delete(`/pedido-pagamentos/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // === Contas Receber Methods ===

  // GET /contas-receber
  public async listContasReceber(
    idPedido?: string
  ): Promise<ContasReceberResponseDTO[]> {
    try {
      const response: AxiosResponse<ContasReceberResponseDTO[]> =
        await this.api.get("/contas-receber", {
          params: { id_pedido: idPedido },
        });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /contas-receber
  public async createContaReceber(
    data: ContasReceberCreateDTO
  ): Promise<ContasReceberResponseDTO> {
    try {
      const response: AxiosResponse<ContasReceberResponseDTO> =
        await this.api.post("/contas-receber", data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /contas-receber/bulk
  public async createBulkContasReceber(
    data: ContasReceberBulkDTO
  ): Promise<ContasReceberResponseDTO[]> {
    try {
      const response: AxiosResponse<ContasReceberResponseDTO[]> =
        await this.api.post("/contas-receber/bulk", data);
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
