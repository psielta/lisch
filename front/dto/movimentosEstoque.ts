/**{
        "id": 21,
        "produto_id": "c6814ca8-64ab-4ee2-a093-f0de2f1c02df",
        "tenant_id": "293e8a4d-12db-4195-8cf3-7c3b89eb555c",
        "deposito_id": "4f397c0d-928f-4117-8fad-7a91f8530507",
        "tipo": "SAIDA",
        "quantidade": 151.00,
        "doc_ref": "ajuste manual (psielta123)",
        "created_at": "2025-04-27T11:57:27.160363-03:00",
        "produto_nome": "Bola",
        "produto_codigo": 2,
        "produto_codigo_ext": "X123",
        "deposito_nome": "TESTE"
    } */

export interface MovimentoEstoque {
  id: number;
  produto_id: string;
  tenant_id: string;
  deposito_id: string;
  tipo: string;
  quantidade: number;
  doc_ref: string | null;
  created_at: string;
  produto_nome: string;
  produto_codigo: number;
  produto_codigo_ext: string;
  deposito_nome: string;
}
