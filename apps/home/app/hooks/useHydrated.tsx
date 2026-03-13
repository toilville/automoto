import { useState, useEffect } from "react";

/**
 * Returns true once the component has hydrated on the client.
 * Use to guard browser-only code in SSR.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
