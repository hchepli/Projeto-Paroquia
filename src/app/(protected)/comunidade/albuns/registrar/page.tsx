'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreateAlbum } from '@/hooks/albums/useCreateAlbum';
import { useEvents } from '@/hooks/events/useEvents';

export default function CriarAlbumPage() {
  const router = useRouter();
  const createAlbum = useCreateAlbum();
  const { data: eventsResult } = useEvents({ limit: 100 });
  const events = eventsResult?.data ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Título é obrigatório.');
      return;
    }

    try {
      const album = await createAlbum.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        eventId: eventId ? Number(eventId) : undefined,
      });
      router.push(`/comunidade/albuns/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar álbum.');
    }
  }

  return (
    <>
      <Header title="Novo Álbum" description="Crie um álbum para depois adicionar as fotos." />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput
            label="Título"
            value={title}
            onChange={setTitle}
            placeholder="Ex: Festa Junina 2026"
            required
          />

          <TextareaInput label="Descrição" value={description} onChange={setDescription} rows={3} />

          <SelectInput
            label="Evento vinculado (RN003 — álbum pode ser avulso)"
            value={eventId}
            onChange={setEventId}
            placeholder="Nenhum (álbum avulso)"
            options={events.map((event) => ({ value: String(event.id), label: event.name }))}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/comunidade/albuns')}
            submitLabel="Criar e adicionar fotos"
            submitting={createAlbum.isPending}
          />
        </form>
      </div>
    </>
  );
}