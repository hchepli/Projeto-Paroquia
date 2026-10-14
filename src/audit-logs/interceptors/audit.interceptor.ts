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
import { AUDITABLE_KEY } from '../decorators/auditable.decorator';
import { AuditLogsService } from '../audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

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

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
    private readonly prismaService: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const entityName = this.reflector.get<string>(AUDITABLE_KEY, context.getHandler());
    if (!entityName) return next.handle();

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    // Proteção extra: sem usuário autenticado, não loga
    if (!userId) return next.handle();

    const method: string = request.method;
    const params = request.params;
    const modelKey = entityName.charAt(0).toLowerCase() + entityName.slice(1);

    let previousData: any = null;

    if ((method === 'PATCH' || method === 'PUT' || method === 'DELETE') && params?.id) {
      try {
        // ids numéricos chegam como string na URL; models com id Int exigem number
        const id = /^\d+$/.test(params.id) ? Number(params.id) : params.id;
        previousData = await (this.prismaService as any)[modelKey].findUnique({ where: { id } });
      } catch {
        previousData = null;
      }
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          // fire-and-forget: falha no log NUNCA derruba nem atrasa a request principal
          void this.record(method, userId, entityName, params, previousData, response);
        },
      }),
    );
  }

  private async record(
    method: string,
    userId: string,
    entity: string,
    params: any,
    previousData: any,
    response: any,
  ) {
    try {
      let action: 'CREATE' | 'UPDATE' | 'DELETE';
      if (method === 'POST') action = 'CREATE';
      else if (method === 'PATCH' || method === 'PUT') action = 'UPDATE';
      else if (method === 'DELETE') action = 'DELETE';
      else return;

      const entityId = response?.id ?? params?.id;
      if (!entityId) return;

      await this.auditLogsService.create({
        userId,
        action,
        entity,
        entityId: String(entityId),
        previousData: previousData ? sanitize(previousData) : undefined,
        newData: action === 'DELETE' || !response ? undefined : sanitize(response),
      } as any);
    } catch (error) {
      this.logger.error(
        `Falha ao gravar audit log (${entity} ${method})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}