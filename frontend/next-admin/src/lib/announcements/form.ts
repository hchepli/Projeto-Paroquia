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

// Mesmos limites do back (RNF008). O back continua sendo quem decide.
export const ANNOUNCEMENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface AnnouncementFormValues {
  title: string;
  content: string;
  categoryId: string;
  status: AnnouncementStatus;
  /** Imagem que já está salva (só para mostrar na edição). */
  currentImageUrl: string | null;
  /** Imagem nova escolhida agora. */
  imageFile: File | null;
  /** Edição: o usuário pediu para tirar a imagem atual. */
  removeImage: boolean;
}

export const EMPTY_ANNOUNCEMENT_FORM: AnnouncementFormValues = {
  title: '',
  content: '',
  categoryId: '',
  status: 'PUBLISHED',
  currentImageUrl: null,
  imageFile: null,
  removeImage: false,
};

export function announcementToFormValues(a: Announcement): AnnouncementFormValues {
  return {
    title: a.title,
    content: a.content,
    categoryId: a.categoryId ? String(a.categoryId) : '',
    status: a.status,
    currentImageUrl: a.imageUrl,
    imageFile: null,
    removeImage: false,
  };
}

/** Valida só o arquivo (usado já na hora de escolher a imagem). */
export function validateAnnouncementImage(file: File): string | null {
  if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) {
    return 'Esse arquivo não é uma imagem aceita. Escolha uma foto nos formatos JPEG, PNG ou WEBP.';
  }
  if (file.size > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
    return 'A imagem é muito grande. Escolha uma de até 5 MB.';
  }
  return null;
}

/** Devolve a primeira mensagem de erro (frase simples) ou null se estiver tudo certo. */
export function validateAnnouncementForm(v: AnnouncementFormValues): string | null {
  const title = v.title.trim();
  const content = v.content.trim();

  if (!title) return 'Escreva o título do aviso.';
  if (title.length > 180) return 'O título pode ter no máximo 180 letras.';
  if (!content) return 'Escreva o texto do aviso.';
  if (content.length > 20000) return 'O texto está muito longo. Encurte e tente de novo.';
  if (v.imageFile) return validateAnnouncementImage(v.imageFile);
  return null;
}

/**
 * Sempre multipart (o back aceita arquivo junto). O slug nunca é enviado.
 * create: campos vazios são omitidos.
 * edit: categoryId vazio LIMPA o tipo; removeImage=true tira a imagem atual.
 */
export function buildAnnouncementFormData(
  v: AnnouncementFormValues,
  mode: 'create' | 'edit',
): FormData {
  const fd = new FormData();
  fd.append('title', v.title.trim());
  fd.append('content', v.content.trim());
  fd.append('status', v.status);

  if (mode === 'edit') fd.append('categoryId', v.categoryId); // '' = limpar
  else if (v.categoryId) fd.append('categoryId', v.categoryId);

  if (v.imageFile) fd.append('image', v.imageFile);
  else if (mode === 'edit' && v.removeImage) fd.append('removeImage', 'true');

  return fd;
}

/** Erro de salvar/ação: nunca mostra a mensagem técnica do back nem texto em inglês. */
export function getAnnouncementSaveError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 413) {
      return 'A imagem é muito grande. Escolha uma de até 5 MB.';
    }
    if (err.status === 409) {
      return 'Já existe um aviso com um título muito parecido. Mude um pouco o título (por exemplo, acrescente a data) e tente de novo.';
    }
    if (err.status === 400) {
      if (/imagem|arquivo|jpeg|webp/i.test(err.message)) {
        return 'Não foi possível usar essa imagem. Escolha uma foto nos formatos JPEG, PNG ou WEBP, de até 5 MB.';
      }
      if (/categoria/i.test(err.message)) {
        return 'O tipo de aviso escolhido não está disponível. Escolha outro ou deixe o campo vazio.';
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