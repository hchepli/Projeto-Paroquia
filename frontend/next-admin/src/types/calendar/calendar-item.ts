export type CalendarItemType = 'mass' | 'event';

export interface CalendarItem {
  id: number;
  title: string;
  date: string;
  type: CalendarItemType;
}
