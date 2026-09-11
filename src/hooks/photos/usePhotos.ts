import { useQuery } from '@tanstack/react-query';

interface Photo {
  id: number;
  albumId: number;
  url: string;
  isCover: boolean;
  createdAt: string;
}

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
