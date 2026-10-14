import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMassTemplateDto } from './dto/create-mass-template.dto';
import { UpdateMassTemplateDto } from './dto/update-mass-template.dto';

const WEEKS_AHEAD = 8;

@Injectable()
export class MassTemplatesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreateMassTemplateDto) {
    return this.prismaService.massTemplate.create({ data: dto });
  }

  findAll() {
    return this.prismaService.massTemplate.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
    });
  }

  async findOne(id: number) {
    const template = await this.prismaService.massTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`MassTemplate ${id} não encontrado`);
    return template;
  }

  async update(id: number, dto: UpdateMassTemplateDto) {
    await this.findOne(id);
    return this.prismaService.massTemplate.update({ where: { id }, data: dto });
  }

  // Sem remove(): exclusão de template com Mass já gerada é bloqueada pela FK
  // (decisão travada: sem onDelete). Fluxo esperado é desativar (active=false)
  // via update(), não excluir. Se quiser um endpoint de exclusão para
  // templates SEM nenhuma Mass gerada ainda, avisar que isso é uma adição
  // separada, não assumida aqui.

  /**
   * Garante que todas as ocorrências de templates ativos, entre agora e
   * `untilDate` (ou pelo menos WEEKS_AHEAD semanas a partir de hoje, o que
   * for mais distante), já existem como Mass real no banco.
   *
   * Idempotente: cada ocorrência é identificada por
   * (generatedFromTemplateId + dateTime exata calculada). Chamar de novo
   * para o mesmo período não duplica.
   */
  async ensureGenerated(untilDate: Date): Promise<void> {
    const now = new Date();
    const minHorizon = new Date(now);
    minHorizon.setDate(minHorizon.getDate() + WEEKS_AHEAD * 7);

    const horizon = untilDate > minHorizon ? untilDate : minHorizon;

    const activeTemplates = await this.prismaService.massTemplate.findMany({
      where: { active: true },
    });

    if (activeTemplates.length === 0) return;

    for (const template of activeTemplates) {
      const occurrences = this.computeOccurrences(template, now, horizon);
      if (occurrences.length === 0) continue;

      const existing = await this.prismaService.mass.findMany({
        where: {
          generatedFromTemplateId: template.id,
          dateTime: { in: occurrences },
        },
        select: { dateTime: true },
      });

      const existingTimes = new Set(existing.map((m) => m.dateTime.getTime()));
      const missing = occurrences.filter((d) => !existingTimes.has(d.getTime()));

      if (missing.length === 0) continue;

      await this.prismaService.mass.createMany({
        data: missing.map((dateTime) => ({
          title: template.title,
          dateTime,
          type: template.type,
          location: template.location,
          notes: template.notes,
          generatedFromTemplateId: template.id,
        })),
      });
    }
  }

  /**
   * Calcula as datas/horas exatas de ocorrência de um template entre
   * `from` e `to` (inclusive), a partir de hoje (não gera ocorrências
   * passadas).
   */
  private computeOccurrences(
    template: { dayOfWeek: number; time: string },
    from: Date,
    to: Date,
  ): Date[] {
    const [hours, minutes] = template.time.split(':').map(Number);
    const occurrences: Date[] = [];

    // Ponto de partida: hoje, zerando hora/min/seg pra iterar dia a dia.
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);

    // Avança até o primeiro dia da semana correspondente.
    const diff = (template.dayOfWeek - cursor.getDay() + 7) % 7;
    cursor.setDate(cursor.getDate() + diff);

    while (cursor <= to) {
      const occurrence = new Date(cursor);
      occurrence.setHours(hours, minutes, 0, 0);

      // Só gera se a ocorrência (com horário aplicado) ainda está no futuro
      // em relação a `from` (evita gerar "hoje às 08:00" se já são 20:00).
      if (occurrence >= from) {
        occurrences.push(occurrence);
      }

      cursor.setDate(cursor.getDate() + 7);
    }

    return occurrences;
  }
}