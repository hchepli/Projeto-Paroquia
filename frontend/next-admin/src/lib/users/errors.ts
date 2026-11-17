function statusOf(e: unknown): number | undefined {
  return typeof e === 'object' && e !== null ? (e as { status?: number }).status : undefined;
}

const COMMON: Record<number, string> = {
  401: 'Sua sessão acabou. Entre de novo.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos esta pessoa. Ela pode ter sido apagada.',
};

export function getUsersLoadError(e: unknown) {
  return COMMON[statusOf(e) ?? 0] ?? 'Não foi possível carregar a lista. Tente de novo em instantes.';
}

export function getUserSaveError(e: unknown, opts: { demotingAdmin?: boolean } = {}) {
  const s = statusOf(e);
  if (s === 409) {
    return opts.demotingAdmin
      ? 'Esta é a única pessoa com acesso total. Dê acesso total a outra pessoa antes de mudar a função.'
      : 'Já existe um usuário com este e-mail. Use outro e-mail.';
  }
  if (s === 400) return 'Confira os campos. Quem é Coordenador de Pastoral precisa ter uma pastoral.';
  return COMMON[s ?? 0] ?? 'Não foi possível salvar. Tente de novo em instantes.';
}

export function getUserStatusError(e: unknown) {
  if (statusOf(e) === 409) {
    return 'Esta é a única pessoa com acesso total. Dê acesso total a outra pessoa antes de desativar.';
  }
  return COMMON[statusOf(e) ?? 0] ?? 'Não foi possível desativar ou reativar. Tente de novo em instantes.';
}

export function getPasswordSaveError(e: unknown) {
  if (statusOf(e) === 400) return 'Esta senha não serve. ' + 'Use de 8 a 72 caracteres, com letra e número.';
  return COMMON[statusOf(e) ?? 0] ?? 'Não foi possível trocar a senha. Tente de novo em instantes.';
}

export function getRoleSaveError(e: unknown) {
  if (statusOf(e) === 409) {
    return 'Já existe uma função com esse nome, ou esta função original não pode mudar de nome.';
  }
  return COMMON[statusOf(e) ?? 0] ?? 'Não foi possível salvar a função. Tente de novo em instantes.';
}

export function getRoleDeleteError(e: unknown) {
  if (statusOf(e) === 409) return 'Esta função ainda tem usuários. Mude a função deles antes de apagar.';
  return COMMON[statusOf(e) ?? 0] ?? 'Não foi possível apagar a função. Tente de novo em instantes.';
}