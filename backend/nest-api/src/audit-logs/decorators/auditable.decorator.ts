import { applyDecorators, SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable_entity';
export const AUDITABLE_OPTIONS_KEY = 'auditable_options';

export interface AuditEntityIdContext {
  params: Record<string, any>;
  body: any;
  response: any;
}

/** Valor fixo ou resolvedor por request. O resultado é truncado em 36 chars (VarChar(36)). */
export type AuditEntityIdResolver =
  | string
  | ((ctx: AuditEntityIdContext) => string | number | undefined);

export interface AuditableOptions {
  /** Força a ação (ex: POST em sub-rota que, semanticamente, é UPDATE da entidade). */
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  /**
   * Fallback/override do entityId para rotas sem :id ou com retorno array
   * (ex: PATCH /sacraments/reorder -> 'reorder'). Se ausente: response.id ?? params.id.
   */
  entityId?: AuditEntityIdResolver;
}

export const Auditable = (entityName: string, options: AuditableOptions = {}) =>
  applyDecorators(
    SetMetadata(AUDITABLE_KEY, entityName),
    SetMetadata(AUDITABLE_OPTIONS_KEY, options),
  );