import { configureStore } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { rootEpic } from "./rootEpic";
import { cidadeSlice } from "./cidade/cidade.slice";
import { movimentosEstoqueSlice } from "./movimentos-estoque/movimentos-estoque.slice";
import { pedidosSlice } from "./pedidos/pedido.slice";
import { actionTracker } from "./actionTracker";
const epicMiddleware = createEpicMiddleware();

export const store = configureStore({
  reducer: {
    cidade: cidadeSlice.reducer,
    movimentosEstoque: movimentosEstoqueSlice.reducer,
    pedidos: pedidosSlice.reducer,
  },
  middleware: (gDM) => gDM().concat(actionTracker).prepend(epicMiddleware),
  devTools: true,
});

epicMiddleware.run(rootEpic as any);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
