// src/audit-logs/decorators/auditable.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable_entity';
export const Auditable = (entityName: string) => SetMetadata(AUDITABLE_KEY, entityName);