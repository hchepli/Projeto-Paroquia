// src/hooks/photos/useUploadPhoto.ts
import { useMutation } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';
import { throwApiError } from '@/lib/errors';

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
  if (!res.ok) await throwApiError(res, 'Erro ao enviar foto.');
  return res.json();
}

// Sem invalidate aqui: a tela envia o lote em série e invalida UMA vez no fim
// (['photos'] e ['albums']), em vez de refetch a cada arquivo.
export function useUploadPhoto() {
  return useMutation({ mutationFn: uploadPhoto });
}