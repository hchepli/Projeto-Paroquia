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

// Comparação em minúsculas (case-insensitive). Nunca vão para os logs (RNF005 + RNF011).
const SENSITIVE_KEYS = new Set([
  'passwordhash',
  'senha_hash',
  'password',
  'newpassword',
  'senha',
  'token',
  'accesstoken',
  'refreshtoken',
]);

// Dados pessoais (LGPD, RNF007): a chave permanece, o valor é mascarado.
const PII_KEYS = new Set([
  'phone',
  'telefone',
  'email',
  'contact',
  'contato',
  'ipaddress',
  'ip_address',
]);

const REDACTED = '[REDACTED]';

export function sanitize(value: any): any {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      const k = key.toLowerCase();
      if (SENSITIVE_KEYS.has(k)) continue;
      out[key] = PII_KEYS.has(k) && val != null ? REDACTED : sanitize(val);
    }
    return out;
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

function resolveEntityId(
  options: AuditableOptions,
  request: any,
  response: any,
): string | undefined {
  const raw =
    typeof options.entityId === 'function'
      ? options.entityId({
          params: request.params ?? {},
          body: request.body,
          response,
        })
      : (options.entityId ?? response?.id ?? request.params?.id);
  if (raw === undefined || raw === null || raw === '') return undefined;
  // audit.entityId é VarChar(36): trunca para nunca estourar (P2000) e perder o log
  return String(raw).slice(0, 36);
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
    // Proteção extra: sem usuário autenticado (rota pública), não loga
    if (!userId) return next.handle();

    const action = resolveAction(request.method, options.action);
    if (!action) return next.handle();

    const params = request.params;
    const modelKey = entityName.charAt(0).toLowerCase() + entityName.slice(1);

    let previousData: any = null;

    // Em UPDATE/DELETE busca o registro ANTES de a request seguir (dados_anteriores reais)
    if ((action === 'UPDATE' || action === 'DELETE') && params?.id) {
      const delegate = (this.prismaService as any)[modelKey];
      if (typeof delegate?.findUnique !== 'function') {
        // @Auditable('X') sem model prisma.x: antes isso falhava em silêncio
        this.logger.warn(
          `@Auditable('${entityName}'): model "${modelKey}" não existe no Prisma; dados_anteriores não serão gravados.`,
        );
      } else {
        try {
          // ids numéricos chegam como string na URL; models com id Int exigem number
          const id = /^\d+$/.test(params.id) ? Number(params.id) : params.id;
          previousData = await delegate.findUnique({ where: { id } });
        } catch {
          previousData = null;
        }
      }
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          // fire-and-forget: falha no log NUNCA derruba nem atrasa a request principal.
          // Se o handler lançar exceção, o `next` do tap não roda: nada é logado.
          void this.record(
            action,
            userId,
            entityName,
            options,
            request,
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
    options: AuditableOptions,
    request: any,
    previousData: any,
    response: any,
  ) {
    try {
      const entityId = resolveEntityId(options, request, response);
      if (!entityId) return;

      await this.auditLogsService.create({
        userId,
        action,
        entity,
        entityId,
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