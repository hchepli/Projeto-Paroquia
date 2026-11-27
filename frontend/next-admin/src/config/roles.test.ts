import { describe, expect, it } from 'vitest';
import { resolveRoleKey } from '@/config/roles';

describe('resolveRoleKey', () => {
  it.each([
    ['Admin Geral', 'ADMIN_GERAL'],
    ['ADMIN_GERAL', 'ADMIN_GERAL'],
    ['Secretaria', 'SECRETARIA'],
    ['Coordenador de Pastoral', 'COORDENADOR_PASTORAL'],
    ['COORDENADOR_PASTORAL', 'COORDENADOR_PASTORAL'],
    ['  coordenador   pastoral ', 'COORDENADOR_PASTORAL'],
  ])('%s -> %s', (name, key) => expect(resolveRoleKey(name)).toBe(key));

  it('cargo desconhecido ou vazio devolve null', () => {
    expect(resolveRoleKey('Tesoureiro')).toBeNull();
    expect(resolveRoleKey('')).toBeNull();
    expect(resolveRoleKey(undefined)).toBeNull();
  });
});