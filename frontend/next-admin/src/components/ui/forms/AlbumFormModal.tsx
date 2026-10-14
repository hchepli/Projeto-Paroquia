'use client';

import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import { useEvents } from '@/hooks/events/useEvents';

interface AlbumFormModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AlbumFormModal({ open, onClose }: AlbumFormModalProps) {
  const queryClient = useQueryClient();
  const { data: eventsResult } = useEvents();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setTitle('');
    setDescription('');
    setEventId('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title) {
      setError('Preencha o título do álbum.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          eventId: eventId ? Number(eventId) : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Erro ao criar álbum.');
      }

      await queryClient.invalidateQueries({ queryKey: ['albums'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar álbum.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo Álbum">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
            placeholder="Festa Junina 2026"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">
            Vincular a um Evento (opcional, RN003)
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
          >
            <option value="">Álbum avulso (sem evento)</option>
            {(eventsResult?.data ?? []).map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#701513] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a1010] disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Criar Álbum'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
