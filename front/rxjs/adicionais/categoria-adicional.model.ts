import axios, { AxiosInstance, AxiosResponse } from "axios";

/* ------------------------------------------------------------------
 *  Interfaces – DTOs de Requisição
 * -----------------------------------------------------------------*/

export interface CreateCategoriaAdicionalOpcaoRequest {
  /** Preenchido apenas quando o grupo já existe
   *  (POST /opcoes).  Não use ao criar grupo + opções */
  id_categoria_adicional: string;
  codigo?: string;
  nome: string;
  /** Preço em formato string (“12.99”) para manter precisão */
  valor: string;
  status: 0 | 1;
}

export interface UpdateCategoriaAdicionalOpcaoRequest {
  codigo?: string;
  nome: string;
  valor: string;
  status: 0 | 1;
}

export interface CreateCategoriaAdicionalRequest {
  id_categoria: string;
  codigo_tipo?: string;
  nome: string;
  /** U = Única, M = Múltipla, Q = Quantidade */
  selecao: "U" | "M" | "Q";
  minimo?: number;
  limite?: number;
  status: 0 | 1;
  /** Opcional: já cria opções junto com o grupo */
  opcoes?: Omit<
    CreateCategoriaAdicionalOpcaoRequest,
    "id_categoria_adicional"
  >[];
}

export interface UpdateCategoriaAdicionalRequest
  extends CreateCategoriaAdicionalRequest {}

/* ------------------------------------------------------------------
 *  Interfaces – DTOs de Resposta
 * -----------------------------------------------------------------*/

export interface CategoriaAdicionalOpcaoResponse {
  id: string;
  seq_id: number;
  id_categoria_adicional: string;
  codigo?: string;
  nome: string;
  valor: string;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CategoriaAdicionalResponse {
  id: string;
  seq_id: number;
  id_categoria: string;
  codigo_tipo?: string;
  nome: string;
  selecao: "U" | "M" | "Q";
  minimo?: number;
  limite?: number;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  opcoes?: CategoriaAdicionalOpcaoResponse[];
}

export interface CategoriaAdicionalListResponse {
  adicionais: CategoriaAdicionalResponse[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface CategoriaAdicionalOpcaoListResponse {
  opcoes: CategoriaAdicionalOpcaoResponse[];
  total_count: number;
  limit: number;
  offset: number;
}

/* ------------------------------------------------------------------
 *  Interfaces auxiliares (status / mensagens)
 * -----------------------------------------------------------------*/

export interface UpdateCategoriaAdicionalStatusRequest {
  status: 0 | 1;
}

export interface UpdateCategoriaAdicionalOpcaoStatusRequest {
  status: 0 | 1;
}

interface ApiError {
  error: string;
}

interface ValidationProblem {
  [key: string]: any;
}

/* ------------------------------------------------------------------
 *  Serviço – CategoriaAdicionalService
 * -----------------------------------------------------------------*/

export class CategoriaAdicionalService {
  private api: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /* -------------------  GRUPOS  ------------------- */

  // GET /categoria-adicionais
  public async listCategoriaAdicionais(
    idCategoria: string,
    limit = 20,
    offset = 0
  ): Promise<CategoriaAdicionalListResponse> {
    try {
      const resp: AxiosResponse<CategoriaAdicionalListResponse> =
        await this.api.get("/categoria-adicionais", {
          params: { id_categoria: idCategoria, limit, offset },
        });
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // GET /categoria-adicionais/{id}
  public async getCategoriaAdicional(
    id: string
  ): Promise<CategoriaAdicionalResponse> {
    try {
      const resp: AxiosResponse<CategoriaAdicionalResponse> =
        await this.api.get(`/categoria-adicionais/${id}`);
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // POST /categoria-adicionais
  public async createCategoriaAdicional(
    data: CreateCategoriaAdicionalRequest
  ): Promise<CategoriaAdicionalResponse> {
    try {
      const resp: AxiosResponse<CategoriaAdicionalResponse> =
        await this.api.post("/categoria-adicionais", data);
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // PUT /categoria-adicionais/{id}
  public async updateCategoriaAdicional(
    id: string,
    data: UpdateCategoriaAdicionalRequest
  ): Promise<CategoriaAdicionalResponse> {
    try {
      const resp: AxiosResponse<CategoriaAdicionalResponse> =
        await this.api.put(`/categoria-adicionais/${id}`, data);
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // DELETE /categoria-adicionais/{id}
  public async deleteCategoriaAdicional(
    id: string
  ): Promise<{ message: string }> {
    try {
      const resp = await this.api.delete<{ message: string }>(
        `/categoria-adicionais/${id}`
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // PUT /categoria-adicionais/{id}/status
  public async updateCategoriaAdicionalStatus(
    id: string,
    data: UpdateCategoriaAdicionalStatusRequest
  ): Promise<{ message: string }> {
    try {
      const resp = await this.api.put<{ message: string }>(
        `/categoria-adicionais/${id}/status`,
        data
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  /* -------------------  OPÇÕES  ------------------- */

  // POST /categoria-adicionais/{id}/opcoes
  public async createOpcao(
    adicionalId: string,
    data: CreateCategoriaAdicionalOpcaoRequest
  ): Promise<CategoriaAdicionalOpcaoResponse> {
    try {
      const resp = await this.api.post<CategoriaAdicionalOpcaoResponse>(
        `/categoria-adicionais/${adicionalId}/opcoes`,
        data
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // PUT /categoria-adicionais/{id}/opcoes/{opcaoId}
  public async updateOpcao(
    adicionalId: string,
    opcaoId: string,
    data: UpdateCategoriaAdicionalOpcaoRequest
  ): Promise<CategoriaAdicionalOpcaoResponse> {
    try {
      const resp = await this.api.put<CategoriaAdicionalOpcaoResponse>(
        `/categoria-adicionais/${adicionalId}/opcoes/${opcaoId}`,
        data
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // DELETE /categoria-adicionais/{id}/opcoes/{opcaoId}
  public async deleteOpcao(
    adicionalId: string,
    opcaoId: string
  ): Promise<{ message: string }> {
    try {
      const resp = await this.api.delete<{ message: string }>(
        `/categoria-adicionais/${adicionalId}/opcoes/${opcaoId}`
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  // PUT /categoria-adicionais/{id}/opcoes/{opcaoId}/status
  public async updateOpcaoStatus(
    adicionalId: string,
    opcaoId: string,
    data: UpdateCategoriaAdicionalOpcaoStatusRequest
  ): Promise<{ message: string }> {
    try {
      const resp = await this.api.put<{ message: string }>(
        `/categoria-adicionais/${adicionalId}/opcoes/${opcaoId}/status`,
        data
      );
      return resp.data;
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  /* -------------------  Tratamento de erros  ------------------- */

  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data: ApiError | ValidationProblem = error.response.data as
        | ApiError
        | ValidationProblem;

      if (status === 400 && "error" in data) {
        return new Error(`Bad Request: ${data.error}`);
      } else if (status === 400) {
        return new Error(`Validation Error: ${JSON.stringify(data)}`);
      } else if (status === 401) {
        return new Error("Unauthorized: Invalid or missing authentication");
      } else if (status === 403) {
        return new Error("Forbidden: Access denied");
      } else if (status === 404) {
        return new Error(`Not Found: ${(data as ApiError).error || "404"}`);
      } else if (status === 409) {
        return new Error(
          `Conflict: ${(data as ApiError).error || "Resource conflict"}`
        );
      }
      return new Error(
        `Server Error: ${(data as ApiError).error || "Internal"}`
      );
    } else if (error.request) {
      return new Error("Network Error: No response from server");
    }
    return new Error(`Request Error: ${error.message}`);
  }
}

/* ------------------------------------------------------------------
 *  Uso – exemplo
 * -----------------------------------------------------------------*/
// const categoriaAdicionalSvc = new CategoriaAdicionalService(axiosInstance);
// categoriaAdicionalSvc
//   .listCategoriaAdicionais("idCategoria")
//   .then(r => console.log(r.adicionais))
//   .catch(e => console.error(e.message));
