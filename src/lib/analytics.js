import { YM_COUNTER_ID } from "@/consts";

export function reachGoal(name, params) {
  if (!YM_COUNTER_ID || typeof window.ym !== "function") return;
  window.ym(YM_COUNTER_ID, "reachGoal", name, params);
}

export function setVisitParams(params) {
  if (!YM_COUNTER_ID || typeof window.ym !== "function") return;
  window.ym(YM_COUNTER_ID, "params", params);
}
