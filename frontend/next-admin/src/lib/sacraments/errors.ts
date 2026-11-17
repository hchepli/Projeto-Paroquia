function statusOf(err: unknown): number | null {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === 'number' ? s : null;
  }
  return null;
}

const SESSION = 'Sua sessão acabou. Entre de novo para continuar.';
const SERVER = 'O sistema está com problema agora. Espere um pouco e tente de novo.';
const NO_PERMISSION = 'Você não tem permissão para fazer isso. Fale com o Admin Geral.';

export function getSacramentLoadError(err: unknown): string {
  const s = statusOf(err);
  if (s === 401) return SESSION;
  if (s === 403) return NO_PERMISSION;
  if (s === 404) return 'Este sacramento não foi encontrado. Ele pode ter sido removido. Volte para a lista.';
  if (s !== null && s >= 500) return SERVER;
  return 'Não foi possível carregar. Verifique sua internet e tente de novo.';
}

export function getSacramentSaveError(err: unknown): string {
  const s = statusOf(err);
  if (s === 401) return SESSION;
  if (s === 403) return NO_PERMISSION;
  if (s === 404) return 'Este sacramento não existe mais. Volte para a lista e confira.';
  if (s === 409) return 'Já existe um sacramento com esse nome. Mude um pouco o nome e tente de novo.';
  if (s === 400) return 'Alguns dados não foram aceitos. Confira os campos e tente de novo.';
  if (s !== null && s >= 500) return SERVER;
  return 'Não foi possível salvar. Verifique sua internet e tente de novo.';
}

export function getSacramentDeleteError(err: unknown): string {
  const s = statusOf(err);
  if (s === 401) return SESSION;
  if (s === 403) return NO_PERMISSION;
  if (s === 404) return 'Este sacramento já foi removido. A lista foi atualizada.';
  if (s !== null && s >= 500) return SERVER;
  return 'Não foi possível remover. Tente de novo.';
}

export function getSacramentReorderError(err: unknown): string {
  const s = statusOf(err);
  if (s === 401) return SESSION;
  if (s === 403) return NO_PERMISSION;
  if (s === 404) return 'Algum sacramento foi removido por outra pessoa. A lista foi atualizada; tente de novo.';
  if (s !== null && s >= 500) return SERVER;
  return 'Não foi possível mudar a posição. Tente de novo.';
}