export type MassType = 'COMMON' | 'SPECIAL';

export interface Mass {
  id: number;
  title: string;
  dateTime: string; // ISO 8601
  type: MassType;
  location: string;
  notes?: string | null;
}