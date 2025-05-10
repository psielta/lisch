/* -------------------------------------------------------------------------- */
/* Auxiliares                                                                 */
/* -------------------------------------------------------------------------- */

export type Nullable<T> = T | null;

/**
 * Datas vêm como strings ISO-8601 (ex.: "2025-04-25T22:25:50.161-03:00")
 * ou `null` quando não preenchidas.
 */
export type ISODate = Nullable<string>;

/**
 * Valores numéricos decimais são serializados como **string** no JSON
 * (para preservar precisão) ou `null`.
 */
export type DecimalString = Nullable<string>;
