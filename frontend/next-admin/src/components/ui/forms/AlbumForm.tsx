// src/components/albums/AlbumForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';

export interface AlbumFormValues {
  title: string;
  description: string;
  eventId: string; // '' = álbum avulso (RN003)
}

interface Props {
  initialValues?: AlbumFormValues;
  eventOptions: { value: string; label: string }[];
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: AlbumFormValues) => void | Promise<void>;
  onCancel: () => void;
}

// Formulário compartilhado entre "Novo Álbum" e "Editar Álbum".
export default function AlbumForm({
  initialValues,
  eventOptions,
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
      setLocalError('Título é obrigatório.');
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
      <TextareaInput label="Descrição" value={description} onChange={setDescription} rows={3} />
      <SelectInput
        label="Evento vinculado (opcional)"
        value={eventId}
        onChange={setEventId}
        placeholder="Nenhum (álbum avulso)"
        options={eventOptions}
      />
      {shownError && <p className="text-sm text-red-600">{shownError}</p>}
      <FormActions onCancel={onCancel} submitLabel={submitLabel} submitting={submitting} />
    </form>
  );
}