// src/audit-logs/decorators/auditable.decorator.ts  (substitui o arquivo)
import { applyDecorators, SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable_entity';
export const AUDITABLE_OPTIONS_KEY = 'auditable_options';

export interface AuditableOptions {
  /** Força a ação (ex: POST em sub-rota que, semanticamente, é UPDATE da entidade). */
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
}

export const Auditable = (entityName: string, options: AuditableOptions = {}) =>
  applyDecorators(
    SetMetadata(AUDITABLE_KEY, entityName),
    SetMetadata(AUDITABLE_OPTIONS_KEY, options),
  );
