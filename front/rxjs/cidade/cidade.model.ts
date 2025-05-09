/*
{
        "id": "063cd478-c6b6-4e8a-9251-0a9e046126a0",
        "tenant_id": "2f9b5414-2e1a-4e8c-b535-b1f1c755af53",
        "ibge_code": 11114444,
        "name": "FLORIANOPOLIS",
        "state_code": "SC",
        "created_at": "2025-04-19T12:09:33.516-03:00"
    }
*/

import { z } from "zod";

export interface Cidade {
    id: string;
    tenant_id: string;
    ibge_code: number;
    name: string;
    state_code: string;
    created_at: string;
}


export type InputCidade = Omit<Cidade, 'id'> & {
    id?: string;
};

export const cidadeSchema = z.object({
    id: z.string().uuid("id deve ser um UUID válido").optional(),
    tenant_id: z.string().uuid("tenant_id deve ser um UUID válido"),
    ibge_code: z.number().min(10000000, "ibge_code deve ter 8 dígitos").max(99999999, "ibge_code deve ter 8 dígitos"),
    name: z.string().min(1, "name é obrigatório"),
    state_code: z.string().length(2, "state_code deve ter 2 caracteres").toUpperCase().regex(/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/, "state_code deve ser um estado válido do Brasil"),
});
