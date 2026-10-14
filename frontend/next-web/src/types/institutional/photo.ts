export interface Photo {
  id: string;
  albumId: string;
  url: string;
  description: string | null;
  isCover: boolean;
}

export type CreatePhotoInput = Omit<Photo, "id">;

export type UpdatePhotoInput = Partial<CreatePhotoInput>;
