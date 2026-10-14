// src/hooks/useIsXl.ts
import { useEffect, useState } from "react";

export function useIsXl() {
  const [isXl, setIsXl] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)"); // breakpoint xl do Tailwind
    setIsXl(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsXl(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isXl;
}