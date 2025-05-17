import { validate as uuidValidate } from "uuid";

export function IsGuid(guid: string | undefined | null) {
  if (!guid) return false;
  return uuidValidate(guid);
}
