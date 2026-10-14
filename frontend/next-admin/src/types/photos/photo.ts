// src/types/photos/photo.ts
export interface Photo {
  id: number;
  albumId: number;
  url: string;
  isCover: boolean;
  createdAt: string;
}