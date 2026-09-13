// src/hooks/photos/usePhotos.ts
import { useQuery } from '@tanstack/react-query';
import { Photo } from '@/types/photos/photo';

async function fetchPhotos(): Promise<Photo[]> {
  const res = await fetch('/api/photos');
  if (!res.ok) throw new Error('Erro ao buscar fotos.');
  return res.json();
}

export function usePhotos() {
  return useQuery({
    queryKey: ['photos'],
    queryFn: fetchPhotos,
  });
}