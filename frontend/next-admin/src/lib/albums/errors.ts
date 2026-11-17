// Traduz erros em frases simples com "o que fazer".
// Lê `status` de forma genérica (as duas classes ApiError do projeto funcionam).

function statusOf(err: unknown): number | null {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === 'number' ? s : null;
  }
  return null;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : '';
}

const GENERIC = 'Algo deu errado. Verifique a internet e tente de novo.';
const SERVER = 'O sistema está com problema agora. Tente de novo em alguns instantes.';
const SESSION = 'Sua sessão acabou. Entre de novo para continuar.';
const FORBIDDEN = 'Você não tem permissão para fazer isso. Fale com a secretaria.';

function common(status: number | null): string | null {
  if (status === 401) return SESSION;
  if (status === 403) return FORBIDDEN;
  if (status !== null && status >= 500) return SERVER;
  return null;
}

export function getAlbumLoadError(err: unknown): string {
  const s = statusOf(err);
  if (s === 404) return 'Este álbum não foi encontrado. Ele pode ter sido removido.';
  return common(s) ?? 'Não foi possível carregar. Verifique a internet e tente de novo.';
}

export function getAlbumSaveError(err: unknown): string {
  const s = statusOf(err);
  if (s === 409) {
    return 'Não foi possível criar o álbum com esse título agora. Mude um pouco o título e tente de novo.';
  }
  if (s === 400) {
    if (/evento/i.test(messageOf(err))) {
      return 'O evento escolhido não existe mais. Escolha outro ou deixe o álbum sem evento.';
    }
    return 'Confira os campos e tente de novo.';
  }
  if (s === 404) return 'Este álbum não existe mais. Volte para a lista de álbuns.';
  return common(s) ?? GENERIC;
}

export function getAlbumDeleteError(err: unknown): string {
  const s = statusOf(err);
  if (s === 404) return 'Este álbum já foi removido. A lista foi atualizada.';
  return common(s) ?? 'Não foi possível apagar o álbum. Tente de novo.';
}

export function getPhotoUploadError(err: unknown): string {
  const s = statusOf(err);
  if (s === 413) return 'A foto é maior que 5 MB. Escolha uma foto menor.';
  if (s === 400) return 'Este arquivo não pôde ser usado como foto. Escolha uma foto JPG, PNG ou WEBP.';
  if (s === 404) return 'Este álbum não existe mais. Volte para a lista de álbuns.';
  return common(s) ?? 'Não foi possível enviar esta foto. Tente de novo.';
}

export function getPhotoActionError(err: unknown, action: 'capa' | 'apagar'): string {
  const s = statusOf(err);
  if (s === 404) return 'Esta foto não existe mais. A página foi atualizada.';
  return (
    common(s) ??
    (action === 'capa'
      ? 'Não foi possível trocar a capa. Tente de novo.'
      : 'Não foi possível apagar a foto. Tente de novo.')
  );
}