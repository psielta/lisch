export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentual(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "0,00%";
  }
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "0";
  }
  return value.toFixed(2);
}
