import { format, parseISO } from "date-fns";

export function formatISODateToStringUsingDateFns(date: string) {
  return format(parseISO(date), "dd/MM/yyyy");
}
export function formatISODateAndTimeToStringUsingDateFns(date: string) {
  return format(parseISO(date), "dd/MM/yyyy HH:mm");
}
