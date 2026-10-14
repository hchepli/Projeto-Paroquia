import { Mass } from "@/types/event/mass";

function dateOffset(daysFromToday: number, hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
}

// Cobre 10 dias pra frente pra simular um cenário real, onde o service
// filtra só os próximos 7 dias a partir de hoje.
export const massMock: Mass[] = Array.from({ length: 10 }).flatMap((_, day) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `mass-${day}-${i}`,
    title: "Celebração da Manhã",
    dateTime: dateOffset(day, 8 + i),
    type: "comum" as const,
    location: "Igreja Matriz",
    notes: null,
  }))
);