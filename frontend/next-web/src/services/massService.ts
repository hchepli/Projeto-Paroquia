import { massMock } from "@/data/mass/mass";
import { WeeklyMassScheduleDay } from "@/types/event/weeklyMassSchedule";

const DELAY_MS = 300;
const DAYS_AHEAD = 7;
const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function getDayLabel(date: Date, offsetDays: number): string {
  if (offsetDays === 0) return "Hoje";
  if (offsetDays === 1) return "Amanhã";
  return WEEKDAY_NAMES[date.getDay()];
}

function toDateKey(dateTime: string): string {
  return dateTime.slice(0, 10); // "YYYY-MM-DD"
}

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/home/weekly-schedule");
// return response.json();
export async function getWeeklyMassSchedule(): Promise<WeeklyMassScheduleDay[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: WeeklyMassScheduleDay[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const dateKey = toDateKey(date.toISOString());

    const items = massMock
      .filter((mass) => toDateKey(mass.dateTime) === dateKey)
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
      .map((mass) => ({
        title: mass.title,
        time: new Date(mass.dateTime).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

    days.push({ day: getDayLabel(date, offset), date: date.toISOString(), items });
  }

  return days;
}