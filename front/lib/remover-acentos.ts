export const removerAcentos = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
