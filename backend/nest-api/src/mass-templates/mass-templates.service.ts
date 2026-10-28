// src/mass-templates/mass-templates.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateMassTemplateDto } from './dto/create-mass-template.dto';
import { UpdateMassTemplateDto } from './dto/update-mass-template.dto';
import { computeOccurrences } from './utils/mass-occurrences.util';

export const MIN_WEEKS_AHEAD = 8;
export const MAX_WEEKS_AHEAD = 26; // teto: o GET público não pode materializar o que o cliente pedir
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SLOT_TAKEN = 'Já existe uma recorrência com esse dia, horário e local.';

@Injectable()
export class MassTemplatesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateMassTemplateDto) {
    try {
      return await this.prismaService.massTemplate.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(SLOT_TAKEN);
      }
      throw error;
    }
  }

  findAll() {
    return this.prismaService.massTemplate.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
    });
  }

  async findOne(id: number) {
    const template = await this.prismaService.massTemplate.findUnique({
      where: { id },
    });
    if (!template)
      throw new NotFoundException(`MassTemplate ${id} não encontrado`);
    return template;
  }

  /**
   * Desativar com removeFuture=true apaga as ocorrências futuras SEM escala
   * (RN016: as com escala são mantidas e devolvidas em keptWithSchedule).
   */
  async update(id: number, dto: UpdateMassTemplateDto, removeFuture = false) {
    if (removeFuture && dto.active !== false) {
      throw new BadRequestException(
        'removeFuture só pode ser usado junto com active=false.',
      );
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const exists = await tx.massTemplate.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!exists)
          throw new NotFoundException(`MassTemplate ${id} não encontrado`);

        const template = await tx.massTemplate.update({
          where: { id },
          data: dto,
        });
        if (!removeFuture) return template;

        const future = {
          generatedFromTemplateId: id,
          dateTime: { gt: new Date() },
        };
        const removed = await tx.mass.deleteMany({
          where: { ...future, schedules: { none: {} } },
        });
        const keptWithSchedule = await tx.mass.count({
          where: { ...future, schedules: { some: {} } },
        });
        return { ...template, removed: removed.count, keptWithSchedule };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(SLOT_TAKEN);
      }
      throw error;
    }
  }

  /**
   * Materializa as ocorrências de templates ativos até `untilDate`, respeitando
   * o mínimo de 8 e o teto de 26 semanas. Idempotente e seguro sob concorrência:
   * a defesa real é o UNIQUE (template, templateOccurrenceAt) + skipDuplicates.
   *
   * Ordem de leitura importa: Mass ANTES de Skip. Se a exclusão de uma ocorrência
   * (Mass removida + skip gravado, atômicos) cair no meio, nunca enxergamos
   * "sem Mass e sem Skip" ao mesmo tempo.
   */
  async ensureGenerated(
    untilDate: Date,
    now: Date = new Date(),
  ): Promise<void> {
    const minHorizon = new Date(now.getTime() + MIN_WEEKS_AHEAD * WEEK_MS);
    const maxHorizon = new Date(now.getTime() + MAX_WEEKS_AHEAD * WEEK_MS);
    let horizon = untilDate > minHorizon ? untilDate : minHorizon;
    if (horizon > maxHorizon) horizon = maxHorizon;

    const templates = await this.prismaService.massTemplate.findMany({
      where: { active: true },
    });

    for (const template of templates) {
      const occurrences = computeOccurrences(template, now, horizon);
      if (occurrences.length === 0) continue;

      const existing = await this.prismaService.mass.findMany({
        where: {
          generatedFromTemplateId: template.id,
          templateOccurrenceAt: { in: occurrences },
        },
        select: { templateOccurrenceAt: true },
      });
      const skipped = await this.prismaService.massTemplateSkip.findMany({
        where: { templateId: template.id, occurrenceAt: { in: occurrences } },
        select: { occurrenceAt: true },
      });

      const taken = new Set<number>([
        ...existing.map((m) => m.templateOccurrenceAt!.getTime()),
        ...skipped.map((s) => s.occurrenceAt.getTime()),
      ]);
      const missing = occurrences.filter((d) => !taken.has(d.getTime()));
      if (missing.length === 0) continue;

      await this.prismaService.mass.createMany({
        data: missing.map((dateTime) => ({
          title: template.title,
          dateTime,
          templateOccurrenceAt: dateTime, // identidade imutável; dateTime pode ser editado depois
          type: template.type,
          location: template.location,
          notes: template.notes,
          generatedFromTemplateId: template.id,
        })),
        skipDuplicates: true,
      });
    }
  }
}
