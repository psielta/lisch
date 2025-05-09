import { combineEpics } from "redux-observable";
import { cidadeEpics } from "./cidade/cidade.epic";

export const rootEpic = combineEpics(cidadeEpics);
