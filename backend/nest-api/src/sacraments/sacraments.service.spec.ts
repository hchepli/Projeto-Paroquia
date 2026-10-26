import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SacramentsService } from './sacraments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { generateSlug } from '../common/utils/slug.util';

jest.mock('../common/utils/slug.util', () => ({
  generateSlug: jest.fn(),
}));

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
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (generateSlug as jest.Mock).mockReturnValue('slug-gerado');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SacramentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SacramentsService);
  });

  describe('create', () => {
    it('usa o slug informado quando enviado', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });

      await service.create({
        name: 'Batismo',
        slug: 'batismo-custom',
        description: 'desc',
      });

      expect(generateSlug).not.toHaveBeenCalled();
      expect(prismaMock.sacrament.create).toHaveBeenCalledWith({
        data: { name: 'Batismo', description: 'desc', slug: 'batismo-custom' },
      });
    });

    it('gera o slug a partir do nome quando não enviado', async () => {
      prismaMock.sacrament.create.mockResolvedValue({ id: 1 });

      await service.create({ name: 'Batismo', description: 'desc' });

      expect(generateSlug).toHaveBeenCalledWith('Batismo');
      expect(prismaMock.sacrament.create).toHaveBeenCalledWith({
        data: { name: 'Batismo', description: 'desc', slug: 'slug-gerado' },
      });
    });

    it('converte P2002 (slug duplicado) em ConflictException', async () => {
      prismaMock.sacrament.create.mockRejectedValue(p2002());

      await expect(
        service.create({ name: 'Batismo', description: 'desc' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('repropaga erros desconhecidos sem converter', async () => {
      const boom = new Error('db fora do ar');
      prismaMock.sacrament.create.mockRejectedValue(boom);

      await expect(
        service.create({ name: 'Batismo', description: 'desc' }),
      ).rejects.toBe(boom);
    });
  });

  describe('findAll', () => {
    it('retorna a lista de sacramentos', async () => {
      const list = [{ id: 1 }, { id: 2 }];
      prismaMock.sacrament.findMany.mockResolvedValue(list);

      await expect(service.findAll()).resolves.toBe(list);
    });

    // UC032: listagem pública deve respeitar displayOrder.
    // ATENÇÃO: este teste FALHA (red) até o service passar a usar orderBy.
    it('ordena por displayOrder (UC032)', async () => {
      prismaMock.sacrament.findMany.mockResolvedValue([]);

      await service.findAll();

      const arg = prismaMock.sacrament.findMany.mock.calls[0][0];
      expect(arg?.orderBy).toBeDefined();
      expect(JSON.stringify(arg.orderBy)).toContain('displayOrder');
    });
  });

  describe('findOne', () => {
    it('retorna o sacramento quando existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
      expect(prismaMock.sacrament.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('lança NotFoundException quando não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza quando o sacramento existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.update.mockResolvedValue({ id: 1, name: 'Novo' });

      await service.update(1, { name: 'Novo' });

      expect(prismaMock.sacrament.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Novo' },
      });
    });

    it('não chama update se o sacramento não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);

      await expect(service.update(99, { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.sacrament.update).not.toHaveBeenCalled();
    });

    it('converte P2002 em ConflictException', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.update.mockRejectedValue(p2002());

      await expect(
        service.update(1, { slug: 'ja-existe' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('remove quando existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.sacrament.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(prismaMock.sacrament.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('lança NotFoundException e não deleta se não existe', async () => {
      prismaMock.sacrament.findUnique.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.sacrament.delete).not.toHaveBeenCalled();
    });
  });
});
