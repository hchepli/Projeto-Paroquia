// src/app/comunidade/albuns/criar/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import AlbumForm, { AlbumFormValues } from '@/components/ui/forms/AlbumForm';
import { useCreateAlbum } from '@/hooks/albums/useCreateAlbum';
import { useEvents } from '@/hooks/events/useEvents';

export default function CriarAlbumPage() {
  const router = useRouter();
  const createAlbum = useCreateAlbum();
  // Álbuns costumam ser de eventos passados: mais recentes primeiro.
  const { data: eventsResult } = useEvents({ limit: 100, sortBy: 'startDate', order: 'desc' });
  const [error, setError] = useState<string | null>(null);

  const eventOptions = (eventsResult?.data ?? []).map((e) => ({
    value: String(e.id),
    label: e.name,
  }));

  async function handleSubmit(values: AlbumFormValues) {
    setError(null);
    try {
      const album = await createAlbum.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        eventId: values.eventId ? Number(values.eventId) : undefined,
      });
      router.push(`/comunidade/albuns/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar álbum.');
    }
  }

  return (
    <>
      <Header
        title="Novo Álbum"
        description="Crie um álbum para depois adicionar as fotos."
        onBack={() => router.back()}
      />
      <div className="py-6">
        <AlbumForm
          eventOptions={eventOptions}
          submitLabel="Criar e adicionar fotos"
          submitting={createAlbum.isPending}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/comunidade/albuns')}
        />
      </div>
    </>
  );
}