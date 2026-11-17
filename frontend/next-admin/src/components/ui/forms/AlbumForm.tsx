// src/components/albums/AlbumForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import EventSearchCombobox from '@/components/ui/inputs/EventSearchCombobox';
import FormActions from '@/components/ui/buttons/FormActions';

export interface AlbumFormValues {
  title: string;
  description: string;
  eventId: string; // '' = álbum sem evento
}

interface Props {
  initialValues?: AlbumFormValues;
  /** Nome do evento já ligado (modo edição), para aparecer no campo. */
  eventLabel?: string;
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: AlbumFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export default function AlbumForm({
  initialValues,
  eventLabel,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [eventId, setEventId] = useState(initialValues?.eventId ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setLocalError('Escreva o título do álbum.');
      return;
    }
    setLocalError(null);
    await onSubmit({ title: title.trim(), description: description.trim(), eventId });
  }

  const shownError = localError ?? error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TextInput
        label="Título"
        value={title}
        onChange={setTitle}
        placeholder="Ex: Festa Junina 2026"
        required
      />
      <TextareaInput label="Descrição (opcional)" value={description} onChange={setDescription} rows={3} />

      <div role="group" aria-labelledby="album-event-label">
        <span id="album-event-label" className="mb-1 block text-sm font-medium text-gray-700">
          Evento deste álbum (opcional)
        </span>
        <EventSearchCombobox value={eventId} onChange={setEventId} initialLabel={eventLabel} />
        <p className="mt-1 text-xs text-gray-500">Deixe em branco se o álbum não for de um evento.</p>
      </div>

      {shownError && (
        <p role="alert" className="text-sm text-red-600">
          {shownError}
        </p>
      )}
      <FormActions onCancel={onCancel} submitLabel={submitLabel} submitting={submitting} />
    </form>
  );
}