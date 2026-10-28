export type CategoryType = 'EVENT' | 'ANNOUNCEMENT';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}