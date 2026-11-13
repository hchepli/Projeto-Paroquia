'use client';

import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import ImageInput from '@/components/ui/inputs/ImageInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useAnnouncementCategories } from '@/hooks/categories/useCategories';
import { throwApiError } from '@/lib/errors';
import {
  ANNOUNCEMENT_IMAGE_TYPES,
  ANNOUNCEMENT_STATUS_OPTIONS,
  AnnouncementFormValues,
  buildAnnouncementFormData,
  getAnnouncementSaveError,
  validateAnnouncementForm,
  validateAnnouncementImage,
} from '@/lib/announcements/form';
import { AnnouncementStatus } from '@/types/announcements/announcement';

interface AnnouncementFormProps {
  mode: 'create' | 'edit';
  announcementId?: number;
  initialValues: AnnouncementFormValues;
  /** Para onde ir depois de salvar ou cancelar (já validado pela página). */
  backPath: string;
}

export default function AnnouncementForm({
  mode,
  announcementId,
  initialValues,
  backPath,
}: AnnouncementFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories } = useAnnouncementCategories();

  const [values, setValues] = useState<AnnouncementFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = mode === 'edit';
  const fallback = isEditing
    ? 'Não foi possível salvar as alterações. Tente de novo em instantes.'
    : 'Não foi possível registrar o aviso. Tente de novo em instantes.';

  function set<K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const validationError = validateAnnouncementForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEditing ? `/api/announcements/${announcementId}` : '/api/announcements',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: buildAnnouncementFormData(values, mode), // sem Content-Type: o navegador define
        },
      );
      if (!res.ok) await throwApiError(res, fallback);

      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      router.push(backPath);
    } catch (err) {
      setError(getAnnouncementSaveError(err, fallback));
      setSubmitting(false); // em sucesso fica travado até a navegação
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TextInput
        label="Título"
        value={values.title}
        onChange={(v) => set('title', v)}
        placeholder="Ex.: Mudança no horário da missa de domingo"
        required
      />

      <TextareaInput
        label="Texto do aviso"
        value={values.content}
        onChange={(v) => set('content', v)}
        rows={8}
        required
      />

      <SelectInput
        label="Tipo do aviso (opcional)"
        value={values.categoryId}
        onChange={(v) => set('categoryId', v)}
        placeholder="Nenhum"
        options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
      />

      <ImageInput
        label="Imagem (opcional)"
        file={values.imageFile}
        onChange={(file) => setValues((prev) => ({ ...prev, imageFile: file, removeImage: false }))}
        accept={ANNOUNCEMENT_IMAGE_TYPES.join(',')}
        validate={validateAnnouncementImage}
        helperText="JPEG, PNG ou WEBP, de até 5 MB."
        existingUrl={values.removeImage ? null : values.currentImageUrl}
        onRemoveExisting={() => set('removeImage', true)}
      />

      <SelectInput
        label="Mostrar no site?"
        value={values.status}
        onChange={(v) => set('status', v as AnnouncementStatus)}
        placeholder="Escolha uma opção"
        required
        options={ANNOUNCEMENT_STATUS_OPTIONS}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <FormActions
        onCancel={() => router.push(backPath)}
        submitLabel={isEditing ? 'Salvar' : 'Registrar aviso'}
        submitting={submitting}
      />
    </form>
  );
}