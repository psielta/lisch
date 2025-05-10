import { configureStore } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { rootEpic } from "./rootEpic";
import { cidadeSlice } from "./cidade/cidade.slice";
import { actionTracker } from "./actionTracker";
import { categoriaSlice } from "./categoria/categoria.slice";
const epicMiddleware = createEpicMiddleware();

export const store = configureStore({
  reducer: {
    cidade: cidadeSlice.reducer,
    categoria: categoriaSlice.reducer,
  },
  middleware: (gDM) => gDM().concat(actionTracker).prepend(epicMiddleware),
  devTools: true,
});

epicMiddleware.run(rootEpic as any);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
