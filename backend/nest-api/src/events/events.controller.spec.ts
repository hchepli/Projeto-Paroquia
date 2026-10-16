import 'reflect-metadata';
import { EventsController } from './events.controller';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AUDITABLE_KEY } from '../audit-logs/decorators/auditable.decorator';

const proto = EventsController.prototype;
// mesma resolução do RolesGuard: método tem prioridade sobre a classe
const effectiveRoles = (fn: object): string[] =>
  Reflect.getMetadata(ROLES_KEY, fn) ?? Reflect.getMetadata(ROLES_KEY, EventsController);

describe('EventsController (metadados de segurança)', () => {
  it.each(['findAll', 'findBySlug', 'findOne'] as const)('%s é público', (m) => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto[m])).toBe(true);
  });

  it.each(['create', 'update', 'remove', 'linkPastoralGroups', 'findAllAdmin', 'findOneAdmin'] as const)(
    '%s NÃO é público',
    (m) => {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto[m])).toBeUndefined();
    },
  );

  it.each(['create', 'update', 'remove', 'linkPastoralGroups'] as const)(
    '%s: só Admin Geral e Secretaria (Coordenador -> 403)',
    (m) => {
      expect(effectiveRoles(proto[m])).toEqual(['Admin Geral', 'Secretaria']);
    },
  );

  it.each(['findAllAdmin', 'findOneAdmin'] as const)('%s: leitura também para Coordenador', (m) => {
    expect(effectiveRoles(proto[m])).toEqual(['Admin Geral', 'Secretaria', 'Coordenador de Pastoral']);
  });

  it.each(['create', 'update', 'remove', 'linkPastoralGroups'] as const)('%s é auditado como "Event"', (m) => {
    expect(Reflect.getMetadata(AUDITABLE_KEY, proto[m])).toBe('Event');
  });

  it('rotas públicas de leitura NÃO são auditadas', () => {
    for (const m of ['findAll', 'findBySlug', 'findOne'] as const) {
      expect(Reflect.getMetadata(AUDITABLE_KEY, proto[m])).toBeUndefined();
    }
  });

  it('rotas fixas (admin, slug) são declaradas antes de ":id"', () => {
    const order = Object.getOwnPropertyNames(proto);
    expect(order.indexOf('findAllAdmin')).toBeLessThan(order.indexOf('findOne'));
    expect(order.indexOf('findBySlug')).toBeLessThan(order.indexOf('findOne'));
  });
});
