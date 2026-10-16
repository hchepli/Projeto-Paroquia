// src/types/categories/category.ts
export interface Category {
  id: number;
  name: string;
  type: 'EVENT' | 'ANNOUNCEMENT';
}