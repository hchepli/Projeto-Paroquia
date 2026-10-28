// src/audit-logs/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AUDITABLE_KEY,
  AUDITABLE_OPTIONS_KEY,
  AuditableOptions,
} from '../decorators/auditable.decorator';
import { AuditLogsService } from '../audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

// Nunca podem ir para dados_anteriores / dados_novos (RNF005 + RNF011)
const SENSITIVE_KEYS = new Set(['passwordHash', 'password', 'newPassword']);

function sanitize(value: any): any {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEYS.has(key))
        .map(([key, val]) => [key, sanitize(val)]),
    );
  }
  return value;
}

// Ação padrão pelo método HTTP; o decorator pode sobrescrever (ex: POST de sub-rota = UPDATE).
function resolveAction(
  method: string,
  forced?: AuditAction,
): AuditAction | undefined {
  if (forced) return forced;
  if (method === 'POST') return 'CREATE';
  if (method === 'PATCH' || method === 'PUT') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return undefined;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
    private readonly prismaService: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const entityName = this.reflector.get<string>(
      AUDITABLE_KEY,
      context.getHandler(),
    );
    if (!entityName) return next.handle();

    const options =
      this.reflector.get<AuditableOptions>(
        AUDITABLE_OPTIONS_KEY,
        context.getHandler(),
      ) ?? {};

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    // Proteção extra: sem usuário autenticado, não loga
    if (!userId) return next.handle();

    const method: string = request.method;
    const params = request.params;
    const action = resolveAction(method, options.action);
    if (!action) return next.handle();

    const modelKey = entityName.charAt(0).toLowerCase() + entityName.slice(1);

    let previousData: any = null;

    // Em UPDATE/DELETE busca o registro ANTES de a request seguir (dados_anteriores reais)
    if ((action === 'UPDATE' || action === 'DELETE') && params?.id) {
      try {
        // ids numéricos chegam como string na URL; models com id Int exigem number
        const id = /^\d+$/.test(params.id) ? Number(params.id) : params.id;
        previousData = await (this.prismaService as any)[modelKey].findUnique({
          where: { id },
        });
      } catch {
        previousData = null;
      }
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          // fire-and-forget: falha no log NUNCA derruba nem atrasa a request principal
          void this.record(
            action,
            userId,
            entityName,
            params,
            previousData,
            response,
          );
        },
      }),
    );
  }

  private async record(
    action: AuditAction,
    userId: string,
    entity: string,
    params: any,
    previousData: any,
    response: any,
  ) {
    try {
      // Sub-rotas (ex: POST :id/pastoral-groups) devolvem array/sem id: cai no id da URL
      const entityId = response?.id ?? params?.id;
      if (!entityId) return;

      await this.auditLogsService.create({
        userId,
        action,
        entity,
        entityId: String(entityId),
        previousData: previousData ? sanitize(previousData) : undefined,
        newData:
          action === 'DELETE' || !response ? undefined : sanitize(response),
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gravar audit log (${entity} ${action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
