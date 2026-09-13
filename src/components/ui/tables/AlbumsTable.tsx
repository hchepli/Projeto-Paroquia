// src/components/ui/tables/AlbumsTable.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Album } from '@/types/albums/album';
import { Photo } from '@/types/photos/photo';

interface AlbumsTableProps {
  items: Album[];
  photosByAlbum: Map<number, Photo[]>;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRemove: (album: Album) => void;
  isRemoving: boolean;
}

export default function AlbumsTable({
  items,
  photosByAlbum,
  isLoading,
  search,
  onSearchChange,
  onRemove,
  isRemoving,
}: AlbumsTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Álbuns</h2>
        <input
          type="text"
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="px-4 py-2 font-medium">Título</th>
            <th className="px-4 py-2 font-medium">Evento vinculado</th>
            <th className="px-4 py-2 font-medium">Fotos</th>
            <th className="px-4 py-2 font-medium">Capa</th>
            <th className="px-4 py-2 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Carregando álbuns...
              </td>
            </tr>
          )}

          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Nenhum álbum encontrado.
              </td>
            </tr>
          )}

          {!isLoading &&
            items.map((album) => {
              const photos = photosByAlbum.get(album.id) ?? [];
              const cover = photos.find((p) => p.isCover);

              return (
                <tr key={album.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{album.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {album.eventId ? `Evento #${album.eventId}` : 'Avulso'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{photos.length}</td>
                  <td className="px-4 py-3">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover.url}
                        alt={`Capa do álbum ${album.title}`}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-amber-600">Sem capa</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => router.push(`/comunidade/albuns/${album.id}`)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Ver fotos
                      </button>
                      <button
                        onClick={() => router.push(`/comunidade/albuns/${album.id}?edit=1`)}
                        className="text-xs font-medium text-gray-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onRemove(album)}
                        disabled={isRemoving}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}