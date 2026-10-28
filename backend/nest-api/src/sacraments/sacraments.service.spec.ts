import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SacramentsService } from './sacraments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

jest.mock('../common/utils/slug.util', () => ({ generateSlug: jest.fn() }));

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

describe('SacramentsService', () => {
  let service: SacramentsService;

  const prismaMock = {
    sacrament: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    (generateSlug as jest.Mock).mockReturnValue('slug-gerado');
    prismaMock.sacrament.aggregate.mockResolvedValue({ _max: { displayOrder: null } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [SacramentsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(SacramentsService);
  });

  describe('create', () => {
    it('usa o slug informado quando enviado', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({ name: 'Batismo', slug: 'batismo-custom', description: 'desc' });

      expect(generateSlug).not.toHaveBeenCalled();
      expect(prismaMock.sacrament.create).toHaveBeenCalledWith({
        data: { name: 'Batismo', description: 'desc', slug: 'batismo-custom', displayOrder: 0 },
      });
    });

    it('gera o slug a partir do nome quando não enviado', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({ name: 'Batismo', description: 'desc' });

      expect(generateSlug).toHaveBeenCalledWith('Batismo');
      expect(prismaMock.sacrament.create).toHaveBeenCalledWith({
        data: { name: 'Batismo', description: 'desc', slug: 'slug-gerado', displayOrder: 0 },
      });
    });

    it('slug vazio cai no fallback gerado', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({ name: 'Batismo', slug: '  ', description: 'desc' });
      expect(generateSlug).toHaveBeenCalledWith('Batismo');
    });

    it('sem displayOrder, vai para o final da lista (max + 1)', async () => {
      prismaMock.sacrament.aggregate.mockResolvedValue({ _max: { displayOrder: 4 } });
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({ name: 'Crisma', description: 'desc' });

      expect(prismaMock.sacrament.create.mock.calls[0][0].data.displayOrder).toBe(5);
    });

    it('respeita displayOrder informado (não consulta o máximo)', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({ name: 'Crisma', description: 'desc', displayOrder: 2 });

      expect(prismaMock.sacrament.aggregate).not.toHaveBeenCalled();
      expect(prismaMock.sacrament.create.mock.calls[0][0].data.displayOrder).toBe(2);
    });

    it('converte faq (classe) em objetos simples { question, answer }', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });
      await service.create({
        name: 'Batismo',
        description: 'desc',
        faq: [{ question: 'Q?', answer: 'A.' }],
      });

      expect(prismaMock.sacrament.create.mock.calls[0][0].data.faq).toEqual([
        { question: 'Q?', answer: 'A.' },
      ]);
    });

    it('converte P2002 (slug duplicado) em ConflictException', async () => {
      prismaMock.sacrament.create.mockRejectedValue(p2002());
      await expect(service.create({ name: 'Batismo', description: 'desc' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('repropaga erros desconhecidos sem converter', async () => {
      const boom = new Error('db fora do ar');
      prismaMock.sacrament.create.mockRejectedValue(boom);
      await expect(service.create({ name: 'Batismo', description: 'desc' })).rejects.toBe(boom);
    });
  });

  describe('findAll', () => {
    it('retorna a lista de sacramentos', async () => {
      const list = [{ id: 1 }, { id: 2 }];
      prismaMock.sacrament.findMany.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
    });

    it('ordena por displayOrder e desempata por id (UC032)', async () => {
      prismaMock.sacrament.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prismaMock.sacrament.findMany).toHaveBeenCalledWith({
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      });
    });
  });

  describe('findOne / findBySlug', () => {
    it('findOne retorna quando existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    });

    it('findOne lança NotFoundException quando não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findBySlug busca por slug', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1, slug: 'batismo' });
      await service.findBySlug('batismo');
      expect(prismaMock.sacrament.findUnique).toHaveBeenCalledWith({ where: { slug: 'batismo' } });
    });

    it('findBySlug lança NotFoundException quando não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nada')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza quando existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.update.mockResolvedValue({ id: 1, name: 'Novo' });
      await service.update(1, { name: 'Novo' });

      expect(prismaMock.sacrament.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Novo' },
      });
    });

    it('não chama update se não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.sacrament.update).not.toHaveBeenCalled();
    });

    it('converte P2002 em ConflictException', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.update.mockRejectedValue(p2002());
      await expect(service.update(1, { slug: 'ja-existe' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('remove quando existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.delete.mockResolvedValue({ id: 1 });
      await service.remove(1);
      expect(prismaMock.sacrament.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('lança NotFoundException e não deleta se não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.sacrament.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('grava displayOrder = posição, dentro de uma transaction, e devolve a lista', async () => {
      prismaMock.sacrament.count.mockResolvedValue(3);
      prismaMock.$transaction.mockResolvedValue([]);
      prismaMock.sacrament.findMany.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder([3, 1, 2]);

      expect(prismaMock.sacrament.update).toHaveBeenCalledTimes(3);
      expect(prismaMock.sacrament.update).toHaveBeenNthCalledWith(1, {
        where: { id: 3 },
        data: { displayOrder: 0 },
      });
      expect(prismaMock.sacrament.update).toHaveBeenNthCalledWith(3, {
        where: { id: 2 },
        data: { displayOrder: 2 },
      });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejeita ids repetidos', async () => {
      await expect(service.reorder([1, 1])).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('rejeita se algum id não existe', async () => {
      prismaMock.sacrament.count.mockResolvedValue(1);
      await expect(service.reorder([1, 2])).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });
});
