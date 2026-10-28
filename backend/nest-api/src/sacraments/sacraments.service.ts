import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSacramentDto, FaqItemDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

const SLUG_CONFLICT = 'Já existe um sacramento com esse slug. Altere o nome ou informe outro slug.';

@Injectable()
export class SacramentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateSacramentDto) {
    const { slug, displayOrder, faq, ...rest } = dto;
    const finalSlug = slug?.trim() || generateSlug(rest.name);
    const order = displayOrder ?? (await this.nextDisplayOrder());

    try {
      return await this.prismaService.sacrament.create({
        data: {
          ...rest, // name, description (obrigatórios) e requiredDocuments
          slug: finalSlug,
          displayOrder: order,
          ...(faq !== undefined && { faq: this.toFaqJson(faq) }),
        },
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
  }

  // UC032: ordem de exibição definida pelo admin; id desempata (determinístico).
  findAll() {
    return this.prismaService.sacrament.findMany({
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const sacrament = await this.prismaService.sacrament.findUnique({ where: { id } });
    if (!sacrament) throw new NotFoundException('Sacramento não encontrado');
    return sacrament;
  }

  async findBySlug(slug: string) {
    const sacrament = await this.prismaService.sacrament.findUnique({ where: { slug } });
    if (!sacrament) throw new NotFoundException('Sacramento não encontrado');
    return sacrament;
  }

  async update(id: number, dto: UpdateSacramentDto) {
    await this.findOne(id);
    try {
      return await this.prismaService.sacrament.update({
        where: { id },
        data: this.toData(dto),
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prismaService.sacrament.delete({ where: { id } });
  }

  /**
   * Reordena em lote: ids[0] vira displayOrder 0, ids[1] vira 1, ...
   * Tudo em uma transaction (ou muda tudo, ou nada). Dois admins ao mesmo tempo:
   * "último ganha", mas sem estado intermediário inconsistente.
   */
  async reorder(ids: number[]) {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('A lista de ids contém repetidos');
    }
    const found = await this.prismaService.sacrament.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      throw new NotFoundException('Algum sacramento da lista não existe mais');
    }

    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.sacrament.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
    return this.findAll();
  }

  // ---- helpers ----

  private async nextDisplayOrder(): Promise<number> {
    const result = await this.prismaService.sacrament.aggregate({
      _max: { displayOrder: true },
    });
    return (result._max.displayOrder ?? -1) + 1;
  }

  // Converte o faq (classes do DTO) em objetos simples aceitos pelo campo Json.
  private toFaqJson(faq: FaqItemDto[]) {
    return faq.map(({ question, answer }) => ({ question, answer }));
  }

  // Dados parciais do PATCH.
  private toData(dto: UpdateSacramentDto) {
    const { faq, ...rest } = dto;
    return {
      ...rest,
      ...(faq !== undefined && { faq: this.toFaqJson(faq) }),
    };
  }

  // O único UNIQUE da tabela é o slug (name NÃO é único).
  private rethrowConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(SLUG_CONFLICT);
    }
    throw error;
  }
}
