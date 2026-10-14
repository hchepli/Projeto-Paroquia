"use client"

import { useEffect, useState } from "react";

interface Breakpoint {
  maxWidth: number;
  value: number;
}

export function useResponsiveWidth(breakpoints: Breakpoint[], fallback: number) {
  const getWidth = () => {
    if (typeof window === "undefined") return fallback;
    const w = window.innerWidth;
    const match = breakpoints.find((bp) => w < bp.maxWidth);
    return match ? match.value : fallback;
  };

  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const update = () => setWidth(getWidth());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}