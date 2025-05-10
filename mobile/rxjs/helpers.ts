import { firstValueFrom } from "rxjs";
import { filter, take, map } from "rxjs/operators";
import { action$ } from "@/rxjs/actionTracker";

export function waitAction<Result>(
  successType: string,
  failureType: string,
  pick: (a: any) => Result
): Promise<Result> {
  return firstValueFrom(
    action$.pipe(
      filter((a) => a.type === successType || a.type === failureType),
      take(1),
      map((a) => {
        if (a.type === successType) return pick(a);
        throw a; // dispara erro
      })
    )
  );
}
