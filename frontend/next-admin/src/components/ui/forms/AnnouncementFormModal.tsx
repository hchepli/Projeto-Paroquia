'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/modals/Modal';
import { Announcement } from '@/types/announcements/announcement';
import { useAnnouncementCategories } from '@/hooks/categories/useCategories';

interface AnnouncementFormModalProps {
  open: boolean;
  onClose: () => void;
  announcement?: Announcement;
}

const inputClass =
  'rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#701513]';

export default function AnnouncementFormModal({
  open,
  onClose,
  announcement,
}: AnnouncementFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(announcement);
const { data: categories } = useAnnouncementCategories();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(announcement?.title ?? '');
    setContent(announcement?.content ?? '');
    setCategoryId(announcement?.categoryId ? String(announcement.categoryId) : '');
    setStatus(announcement?.status ?? 'PUBLISHED');
    setImageUrl(announcement?.imageUrl ?? '');
    setError(null);
  }, [open, announcement]);

  function handleClose() {
    setError(null);
    onClose();
  }

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
      const url = isEditing ? `/api/announcements/${announcement!.id}` : '/api/announcements';
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          // null = limpar (PATCH); undefined seria ignorado e o valor antigo ficaria
          categoryId: categoryId ? Number(categoryId) : null,
          imageUrl: imageUrl.trim() || null,
          status,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
        throw new Error(message ?? `Erro ao ${isEditing ? 'atualizar' : 'criar'} comunicado.`);
      }

      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Erro ao ${isEditing ? 'atualizar' : 'criar'} comunicado.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Editar Comunicado' : 'Novo Comunicado'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Conteúdo</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputClass}
            rows={5}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Categoria (opcional)</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">Nenhuma</option>
            {(categories ?? []).map((c) => (
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
            className={inputClass}
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
            className={inputClass}
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
            {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Comunicado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}