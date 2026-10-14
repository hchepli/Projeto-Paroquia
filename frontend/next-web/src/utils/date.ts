/**
 * Formata uma data ISO para "22 de julho de 2026" (pt-BR).
 */
export function formatEventDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/**
 * Formata o horário de uma data ISO para "19:00" (pt-BR).
 */
export function formatEventTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Retorna o rótulo do mês/ano de uma data ISO, com a primeira letra
 * maiúscula. Ex: "2026-07-22" -> "Julho de 2026".
 */
export function getMonthLabel(isoDate: string): string {
    const label = new Date(isoDate).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
}
