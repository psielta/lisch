export interface ClienteMaisFaturadosNosUltimos30Dias_Item {
  id_cliente: string;
  cliente: string;
  valor_liquido: number;
}

export interface ClienteAniversario {
  id: string;
  cliente: string;
  data_nascimento: string;
  proximo_aniversario: string;
}
