import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  ClienteResponse,
  PaginatedResponse,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "./cliente.model";

interface ApiError {
  error: string;
}

interface ValidationProblem {
  [key: string]: any;
}

export class ClienteService {
  private api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  // GET /clientes
  public async listClientes(
    page: number = 1,
    limit: number = 10,
    sort: string = "nome",
    order: string = "asc",
    q?: string,
    nome?: string,
    fantasia?: string,
    cpf?: string,
    cnpj?: string,
    cidade?: string,
    uf?: string,
    tipo_pessoa?: "F" | "J"
  ): Promise<PaginatedResponse<ClienteResponse>> {
    try {
      const response: AxiosResponse<PaginatedResponse<ClienteResponse>> =
        await this.api.get("/clientes", {
          params: {
            page,
            limit,
            sort,
            order,
            q,
            nome,
            fantasia,
            cpf,
            cnpj,
            cidade,
            uf,
            tipo_pessoa,
          },
        });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /clientes/simple
  public async listClientesSimple(
    limit: number = 10,
    offset: number = 0
  ): Promise<ClienteResponse[]> {
    try {
      const response: AxiosResponse<ClienteResponse[]> = await this.api.get(
        "/clientes/simple",
        {
          params: {
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

  // GET /clientes/count
  public async countClientes(): Promise<{ count: number }> {
    try {
      const response: AxiosResponse<{ count: number }> = await this.api.get(
        "/clientes/count"
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /clientes/{id}
  public async getCliente(id: string): Promise<ClienteResponse> {
    try {
      const response: AxiosResponse<ClienteResponse> = await this.api.get(
        `/clientes/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /clientes/cpf/{cpf}
  public async getClienteByCPF(cpf: string): Promise<ClienteResponse> {
    try {
      const response: AxiosResponse<ClienteResponse> = await this.api.get(
        `/clientes/cpf/${cpf}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // GET /clientes/cnpj/{cnpj}
  public async getClienteByCNPJ(cnpj: string): Promise<ClienteResponse> {
    try {
      const response: AxiosResponse<ClienteResponse> = await this.api.get(
        `/clientes/cnpj/${cnpj}`
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST /clientes
  public async createCliente(data: CreateClienteDTO): Promise<ClienteResponse> {
    try {
      const response: AxiosResponse<ClienteResponse> = await this.api.post(
        "/clientes",
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT /clientes/{id}
  public async updateCliente(
    id: string,
    data: UpdateClienteDTO
  ): Promise<ClienteResponse> {
    try {
      const response: AxiosResponse<ClienteResponse> = await this.api.put(
        `/clientes/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE /clientes/{id}
  public async deleteCliente(id: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> =
        await this.api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

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
