"use client";

import { useEffect, useState } from "react";

// Breakpoints alinhados ao Tailwind (sm=640, lg=1024, xl=1280)
// e ao grid usado na página de Comunicados:
// grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
const BREAKPOINTS: Array<{ query: string; items: number }> = [
    { query: "(min-width: 1280px)", items: 4 }, // xl
    { query: "(min-width: 1024px)", items: 3 }, // lg
    { query: "(min-width: 640px)", items: 2 },  // sm
];

function getItemsPerView(): number {
    if (typeof window === "undefined") return 1;
    const match = BREAKPOINTS.find(({ query }) => window.matchMedia(query).matches);
    return match?.items ?? 1;
}

/**
 * Retorna quantos cards do carrossel de comunicados devem ser exibidos
 * por "página", de acordo com o breakpoint atual (1/2/3/4).
 */
export function useCarouselItemsPerView(): number {
    const [itemsPerView, setItemsPerView] = useState<number>(getItemsPerView);

    useEffect(() => {
        const mediaQueries = BREAKPOINTS.map(({ query }) => window.matchMedia(query));

        const handleChange = () => setItemsPerView(getItemsPerView());

        // valor inicial correto no client (evita mismatch de hidratação)
        handleChange();

        mediaQueries.forEach((mq) => mq.addEventListener("change", handleChange));
        return () => {
            mediaQueries.forEach((mq) => mq.removeEventListener("change", handleChange));
        };
    }, []);

    return itemsPerView;
}