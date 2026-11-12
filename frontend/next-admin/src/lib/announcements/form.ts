import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import type { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';

export const ANNOUNCEMENT_STATUS_LABEL: Record<AnnouncementStatus, string> = {
  PUBLISHED: 'Publicado',
  DRAFT: 'Ainda não publicado',
};

export const ANNOUNCEMENT_STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Mostrar no site' },
  { value: 'DRAFT', label: 'Ainda não publicado (não aparece no site)' },
];

export interface AnnouncementFormValues {
  title: string;
  content: string;
  categoryId: string;
  imageUrl: string;
  status: AnnouncementStatus;
}

export const EMPTY_ANNOUNCEMENT_FORM: AnnouncementFormValues = {
  title: '',
  content: '',
  categoryId: '',
  imageUrl: '',
  status: 'PUBLISHED',
};

export function announcementToFormValues(a: Announcement): AnnouncementFormValues {
  return {
    title: a.title,
    content: a.content,
    categoryId: a.categoryId ? String(a.categoryId) : '',
    imageUrl: a.imageUrl ?? '',
    status: a.status,
  };
}

/** Devolve a primeira mensagem de erro (frase simples) ou null se estiver tudo certo. */
export function validateAnnouncementForm(v: AnnouncementFormValues): string | null {
  const title = v.title.trim();
  const content = v.content.trim();
  const imageUrl = v.imageUrl.trim();

  if (!title) return 'Escreva o título do aviso.';
  if (title.length > 180) return 'O título pode ter no máximo 180 letras.';
  if (!content) return 'Escreva o texto do aviso.';
  if (content.length > 20000) return 'O texto está muito longo. Encurte e tente de novo.';
  if (imageUrl) {
    if (!/^https:\/\//i.test(imageUrl)) {
      return 'O endereço da imagem precisa começar com https://. Se não tiver imagem, deixe o campo vazio.';
    }
    if (imageUrl.length > 255) return 'O endereço da imagem é muito longo.';
  }
  return null;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  categoryId?: number | null;
  imageUrl?: string | null;
  status: AnnouncementStatus;
}

/**
 * create: campos vazios são omitidos. O slug nunca é enviado (o back gera sozinho).
 * edit: campos vazios viram null para REMOVER (tipo e imagem).
 */
export function buildAnnouncementPayload(
  v: AnnouncementFormValues,
  mode: 'create' | 'edit',
): AnnouncementPayload {
  const base = { title: v.title.trim(), content: v.content.trim(), status: v.status };
  const categoryId = v.categoryId ? Number(v.categoryId) : undefined;
  const imageUrl = v.imageUrl.trim() || undefined;

  if (mode === 'create') return { ...base, categoryId, imageUrl };
  return { ...base, categoryId: categoryId ?? null, imageUrl: imageUrl ?? null };
}

/** Erro de salvar/ação: nunca mostra a mensagem técnica do back nem texto em inglês. */
export function getAnnouncementSaveError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      return 'Já existe um aviso com um título muito parecido. Mude um pouco o título (por exemplo, acrescente a data) e tente de novo.';
    }
    if (err.status === 400) {
      if (/categoria/i.test(err.message)) {
        return 'O tipo de aviso escolhido não está disponível. Escolha outro ou deixe o campo vazio.';
      }
      if (/imageUrl|imagem|url/i.test(err.message)) {
        return 'O endereço da imagem não é válido. Ele precisa começar com https://. Se não tiver imagem, deixe o campo vazio.';
      }
      return 'Algum campo não está certo. Confira o título e o texto do aviso e tente de novo.';
    }
    if (err.status === 403) {
      return 'Você não tem permissão para mexer em avisos. Fale com o Admin Geral ou com a Secretaria.';
    }
    return getFriendlyErrorMessage(err, fallback);
  }
  return fallback; // falha de rede etc.: evita "Failed to fetch" na tela
}

/** Erro de carregar dados (listas/detalhe). */
export function getAnnouncementLoadError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? getFriendlyErrorMessage(err, fallback) : fallback;
}