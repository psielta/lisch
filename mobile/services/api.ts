import { Produto } from "@/dto/Produto";
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.102:3081/api/v1/mobile",
  //baseURL: "https://api.psielt.com/api/v1/mobile",
  timeout: 10000, // 10 seconds timeout
});

export { api };

/**{
        "id": "254b2686-45c8-488e-ac09-7e5409aeeb55",
        "tenant_id": "293e8a4d-12db-4195-8cf3-7c3b89eb555c",
        "ibge_code": 1111111,
        "name": "Pouso Alegre",
        "state_code": "MG",
        "created_at": "2025-04-21T18:00:44.868486-03:00"
    } */

export interface Cidade {
  id: string;
  tenant_id: string;
  ibge_code: number;
  name: string;
  state_code: string;
  created_at: string;
}

export async function getCidades(): Promise<Cidade[]> {
  const response = await api.get("/cidades");
  return response.data;
}
