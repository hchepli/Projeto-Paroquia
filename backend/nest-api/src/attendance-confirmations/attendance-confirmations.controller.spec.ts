import 'reflect-metadata';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AttendanceConfirmationsController } from './attendance-confirmations.controller';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AUDITABLE_KEY } from '../audit-logs/decorators/auditable.decorator';

const proto = AttendanceConfirmationsController.prototype;
const roles = (fn: object): string[] | undefined => Reflect.getMetadata(ROLES_KEY, fn);

describe('AttendanceConfirmationsController (metadados de segurança)', () => {
  it('POST é público e protegido pelo ThrottlerGuard (RNF017)', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.create)).toBe(true);
    expect(Reflect.getMetadata('__guards__', proto.create)).toContain(ThrottlerGuard);
  });

  it.each(['findAll', 'findOne', 'remove'] as const)('%s só para Admin Geral e Secretaria (Coordenador -> 403)', (m) => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto[m])).toBeUndefined();
    expect(roles(proto[m])).toEqual(['Admin Geral', 'Secretaria']);
  });

  it('nenhuma rota usa @Auditable (nome/contato iriam para logs_auditoria, LGPD)', () => {
    for (const m of ['create', 'findAll', 'findOne', 'remove'] as const) {
      expect(Reflect.getMetadata(AUDITABLE_KEY, proto[m])).toBeUndefined();
    }
  });

  it('não existe mais PATCH (visitante não é editado pelo admin)', () => {
    expect((proto as any).update).toBeUndefined();
  });
});
