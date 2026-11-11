// src/config/roles.ts
// Traduz o nome do cargo vindo do back para uma chave estável usada no front.

export type RoleKey = 'ADMIN_GERAL' | 'SECRETARIA' | 'COORDENADOR_PASTORAL';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

// Aceita "Admin Geral", "ADMIN_GERAL", "Coordenador de Pastoral", "COORDENADOR_PASTORAL"...
const ROLE_BY_NAME: Record<string, RoleKey> = {
  'admin geral': 'ADMIN_GERAL',
  secretaria: 'SECRETARIA',
  'coordenador de pastoral': 'COORDENADOR_PASTORAL',
  'coordenador pastoral': 'COORDENADOR_PASTORAL',
};

export function resolveRoleKey(name?: string | null): RoleKey | null {
  if (!name) return null;
  return ROLE_BY_NAME[normalize(name)] ?? null;
}
