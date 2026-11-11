'use client';

import { useState, FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useAnnouncementCategories } from '@/hooks/categories/useCategories';

export default function RegistrarComunicadoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories } = useAnnouncementCategories();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Preencha título e conteúdo.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: categoryId ? Number(categoryId) : undefined,
          status,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
        throw new Error(message ?? 'Erro ao criar comunicado.');
      }

      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      router.push('/comunidade/comunicados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunicado.');
      setSubmitting(false); // em sucesso mantém travado até a navegação
    }
  }

  return (
    <>
      <Header
        title="Registrar Comunicado"
        description="Crie um novo comunicado para a comunidade."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput
            label="Título"
            value={title}
            onChange={setTitle}
            placeholder="Atenção: os horários..."
            required
          />

          <TextareaInput label="Conteúdo" value={content} onChange={setContent} rows={6} required />

          <SelectInput
            label="Categoria"
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Nenhuma"
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
          />

          <TextInput
            label="Imagem (URL, opcional)"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://res.cloudinary.com/..."
          />

          <SelectInput
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as 'DRAFT' | 'PUBLISHED')}
            placeholder="Selecione o status"
            required
            options={[
              { value: 'PUBLISHED', label: 'Publicado' },
              { value: 'DRAFT', label: 'Rascunho (oculto)' },
            ]}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.back()}
            submitLabel="Criar Comunicado"
            submitting={submitting}
          />
        </form>
      </div>
    </>
  );
}