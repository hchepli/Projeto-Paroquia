// src/app/albuns/registrar/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import AlbumForm, { AlbumFormValues } from '@/components/ui/forms/AlbumForm';
import { useCreateAlbum } from '@/hooks/albums/useCreateAlbum';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getAlbumSaveError } from '@/lib/albums/errors';

function safeBackPath(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function RegistrarAlbumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backPath = safeBackPath(searchParams.get('voltar'), '/albuns');
  const { canManageAlbums, isLoading: permsLoading } = usePermissions();
  const createAlbum = useCreateAlbum();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: AlbumFormValues) {
    setError(null);
    try {
      const album = await createAlbum.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        eventId: values.eventId ? Number(values.eventId) : undefined,
      });
      router.push(`/albuns/${album.id}`);
    } catch (err) {
      setError(getAlbumSaveError(err));
    }
  }

  if (permsLoading) {
    return (
      <>
        <Header title="Novo álbum" onBack={() => router.push(backPath)} />
        <p className="mt-6 text-sm text-gray-500">Carregando...</p>
      </>
    );
  }

  if (!canManageAlbums) {
    return (
      <>
        <Header title="Novo álbum" onBack={() => router.push(backPath)} />
        <p role="alert" className="mt-6 text-sm text-red-700">
          Você não pode criar álbuns. Para criar um, fale com a secretaria.
        </p>
      </>
    );
  }

  return (
    <>
      <Header
        title="Novo álbum"
        description="Crie o álbum agora e, no próximo passo, adicione as fotos."
        onBack={() => router.push(backPath)}
      />
      <div className="py-6">
        <AlbumForm
          submitLabel="Criar e adicionar fotos"
          submitting={createAlbum.isPending}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => router.push(backPath)}
        />
      </div>
    </>
  );
}

export default function RegistrarAlbumPage() {
  return (
    <Suspense fallback={null}>
      <RegistrarAlbumContent />
    </Suspense>
  );
}