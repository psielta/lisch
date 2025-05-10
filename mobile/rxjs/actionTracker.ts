import { Subject } from "rxjs";
import { Middleware } from "@reduxjs/toolkit";

export const action$ = new Subject<any>();

export const actionTracker: Middleware = () => (next) => (action) => {
  const result = next(action);
  action$.next(action); // <-- todas as ações passam por aqui
  return result;
};
