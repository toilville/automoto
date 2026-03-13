/**
 * useDevToolsStore — React hook that subscribes to the DevTools store.
 * Uses useSyncExternalStore for tear-free reads.
 */
import { useSyncExternalStore } from "react";
import { getDevToolsStore, type DevToolsState } from "./devtools-store.js";

export function useDevToolsStore(): DevToolsState {
  const store = getDevToolsStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useDevToolsActions() {
  const store = getDevToolsStore();
  return store.getState();
}
