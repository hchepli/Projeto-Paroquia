'use client';

import { useState, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import ImageInput from '@/components/ui/inputs/ImageInput';
import FormActions from '@/components/ui/buttons/FormActions';

interface Category {
  id: number;
  name: string;
  type: 'EVENT' | 'ANNOUNCEMENT';
}

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Erro ao buscar categorias');
  return response.json();
}

export default function RegistrarComunicadoPage() {
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const announcementCategories = (categories ?? []).filter((c) => c.type === 'ANNOUNCEMENT');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleCancel() {
    // TODO: confirmar estratégia de "voltar" (Bloco 9, Dia 1 do roadmap)
    window.history.back();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !content) {
      setError('Preencha título e conteúdo.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: se imageFile existir, subir pro Cloudinary primeiro e pegar a
      // URL de retorno (fluxo/endpoint ainda a confirmar com você) antes de
      // montar o payload abaixo com imageUrl.

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId ? Number(categoryId) : undefined,
          status,
          imageUrl: undefined, // TODO: preencher com a URL do Cloudinary
          // authorId NÃO vai no body — preenchido pelo backend a partir do usuário logado.
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Erro ao criar comunicado.');
      }

      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      // TODO: redirecionar pra /comunidade/comunicados (ver estratégia do Bloco 9, Dia 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunicado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Registrar Comunicado"
        description="Crie um novo comunicado para a comunidade."
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

          <TextareaInput
            label="Conteúdo"
            value={content}
            onChange={setContent}
            rows={4}
            required
          />

          <SelectInput
            label="Categoria"
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Nenhuma"
            options={announcementCategories.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />

          <ImageInput
            label="Imagem"
            file={imageFile}
            onChange={setImageFile}
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
            onCancel={handleCancel}
            submitLabel="Criar Comunicado"
            submitting={submitting}
          />
        </form>
      </div>
    </>
  );
}