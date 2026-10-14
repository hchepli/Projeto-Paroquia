export interface WeeklyMassScheduleItem {
  title: string;
  time: string;
}

export interface WeeklyMassScheduleDay {
  day: string;
  date: string;
  items: WeeklyMassScheduleItem[];
}