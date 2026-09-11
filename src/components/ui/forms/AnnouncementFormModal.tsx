'use client';

import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';

interface AnnouncementFormModalProps {
  open: boolean;
  onClose: () => void;
}

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

export default function AnnouncementFormModal({ open, onClose }: AnnouncementFormModalProps) {
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: open,
  });
  const announcementCategories = (categories ?? []).filter((c) => c.type === 'ANNOUNCEMENT');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  // imageUrl fica como texto simples por enquanto — upload real (Cloudflare R2)
  // ainda não existe pra Announcement, só pra Photo (roadmap-upload-fotos.md).
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setTitle('');
    setContent('');
    setCategoryId('');
    setStatus('PUBLISHED');
    setImageUrl('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
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
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId ? Number(categoryId) : undefined,
          status,
          imageUrl: imageUrl || undefined,
          // authorId NÃO vai no body — preenchido pelo backend a partir do usuário logado.
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Erro ao criar comunicado.');
      }

      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comunicado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo Comunicado">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
            placeholder="Atenção: os horários..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Conteúdo</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Categoria (opcional)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
          >
            <option value="">Nenhuma</option>
            {announcementCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Imagem (URL, opcional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
            placeholder="https://..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]"
          >
            <option value="PUBLISHED">Publicado</option>
            <option value="DRAFT">Rascunho (oculto)</option>
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
            {submitting ? 'Salvando...' : 'Criar Comunicado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
