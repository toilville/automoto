import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-scrolls a container to the bottom when new content arrives.
 * Pauses if the user has scrolled up manually.
 */
export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    isUserScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isUserScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, handleScroll };
}
