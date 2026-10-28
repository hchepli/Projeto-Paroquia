// src/common/route-access.spec.ts
// Garante que nenhuma rota dos módulos já revisados fica "aberta por esquecimento"
// (RolesGuard libera rota sem @Roles). Acrescente os controllers a cada módulo revisado.
import 'reflect-metadata';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { MassesController } from '../masses/masses.controller';
import { MassTemplatesController } from '../mass-templates/mass-templates.controller';
import { CalendarController } from '../calendar/calendar.controller';

const CONTROLLERS = [
  MassesController,
  MassTemplatesController,
  CalendarController,
];

describe('toda rota declara @Public ou @Roles', () => {
  it.each(CONTROLLERS.map((c) => [c.name, c] as const))(
    '%s',
    (_name, controller) => {
      const classOk =
        Reflect.getMetadata(IS_PUBLIC_KEY, controller) ||
        Reflect.getMetadata(ROLES_KEY, controller)?.length;
      const unguarded: string[] = [];

      for (const key of Object.getOwnPropertyNames(controller.prototype)) {
        const handler = controller.prototype[key];
        if (
          key === 'constructor' ||
          Reflect.getMetadata(METHOD_METADATA, handler) === undefined
        )
          continue;
        const ok =
          classOk ||
          Reflect.getMetadata(IS_PUBLIC_KEY, handler) ||
          Reflect.getMetadata(ROLES_KEY, handler)?.length;
        if (!ok) unguarded.push(key);
      }
      expect(unguarded).toEqual([]);
    },
  );
});
