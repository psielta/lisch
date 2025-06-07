// endpoint: /clientes?celular=87943217919

/**
 * 
 * {
    "current_page": 1,
    "total_pages": 1,
    "page_size": 10,
    "total_count": 1,
    "items": [
        {
            "id": "4ab9440e-b20f-40c9-b7b5-bbbb7785c7c4",
            "tenant_id": "321d18ff-7ead-431e-83f2-ab66ac210bb4",
            "tipo_pessoa": "F",
            "nome_razao_social": "Antonio Souza",
            "nome_fantasia": "",
            "cpf": "19372703636",
            "cnpj": "",
            "rg": "461946986",
            "ie": "",
            "im": "",
            "data_nascimento": "1965-07-05",
            "email": "antonio1470@email.com",
            "telefone": "",
            "celular": "(87)94321-7919",
            "cep": "18911779",
            "logradouro": "R Prof emidio de Lima",
            "numero": "55",
            "complemento": "Casa",
            "bairro": "Bela Vista",
            "cidade": "Curitiba",
            "uf": "RJ",
            "created_at": "2025-05-25T09:49:17.474775-03:00",
            "updated_at": "2025-06-06T17:07:36.911195-03:00"
        }
    ]
}
 * 
 */

import {
  ClienteResponse,
  PaginatedResponse,
} from "@/rxjs/clientes/cliente.model";
import api from "../lib/api";

export async function getClientesPorCelular(
  celular: string
): Promise<PaginatedResponse<ClienteResponse>> {
  const responseAxios = await api.get(
    `/clientes/smartsearch?search=${celular}&page_size=50`
  );
  return responseAxios.data;
}
