// src/hooks/photos/useUploadPhoto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';

interface UploadPhotoInput {
  albumId: number;
  file: File;
  isCover?: boolean;
}

async function uploadPhoto({ albumId, file, isCover }: UploadPhotoInput): Promise<Photo> {
  const formData = new FormData();
  formData.append('albumId', String(albumId));
  formData.append('isCover', String(isCover ?? false));
  formData.append('file', file);

  const res = await fetch('/api/photos', { method: 'POST', body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? 'Erro ao enviar foto.');
  return data;
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}