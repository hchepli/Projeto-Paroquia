import { Transform } from 'class-transformer';
import type { AuthUser } from '../../auth/decorators/current-user.decorator';
import { ROLE_NAMES } from '../../common/constrants/role-names.constants';

export const isCoordinator = (user: AuthUser) => user.roleName === ROLE_NAMES.COORDENADOR;

/** null === null NÃO libera acesso: Coordenador sem pastoral não é dono de nada. */
export function canAccessPastoral(user: AuthUser, pastoralGroupId: number | null): boolean {
  if (!isCoordinator(user)) return true;
  return user.pastoralGroupId != null && user.pastoralGroupId === pastoralGroupId;
}

/** trim + espaços colapsados + minúsculas. Espelha o CHECK do banco. */
export function normalizeRole(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export const NormalizeRole = () =>
  Transform(({ value }) => (typeof value === 'string' ? normalizeRole(value) : value));
