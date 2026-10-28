import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('unique', {
    code: 'P2002',
    clientVersion: 'test',
  });

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  const prisma = {
    announcement: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    category: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AnnouncementsService);
  });

  describe('público (RN: nunca vaza rascunho)', () => {
    it('findAll filtra status PUBLISHED e não seleciona authorId/content', async () => {
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10 });

      const args = prisma.announcement.findMany.mock.calls[0][0];
      expect(args.where.status).toBe('PUBLISHED');
      expect(args.select.authorId).toBeUndefined();
      expect(args.select.content).toBeUndefined();
    });

    it('findOne de rascunho/inexistente -> 404', async () => {
      prisma.announcement.findFirst.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.announcement.findFirst.mock.calls[0][0].where).toEqual({
        id: 1,
        status: 'PUBLISHED',
      });
    });

    it('findBySlug de rascunho/inexistente -> 404', async () => {
      prisma.announcement.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('admin', () => {
    it('findAllAdmin aplica filtro de status quando informado', async () => {
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.count.mockResolvedValue(0);
      await service.findAllAdmin({ status: 'DRAFT' });
      expect(prisma.announcement.findMany.mock.calls[0][0].where.status).toBe(
        'DRAFT',
      );
    });

    it('findAllAdmin sem status traz todos', async () => {
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.count.mockResolvedValue(0);
      await service.findAllAdmin({});
      expect(
        prisma.announcement.findMany.mock.calls[0][0].where.status,
      ).toBeUndefined();
    });

    it('getStats devolve contagens', async () => {
      prisma.announcement.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      await expect(service.getStats()).resolves.toEqual({
        total: 10,
        published: 7,
        draft: 3,
        thisMonth: 2,
      });
    });
  });

  describe('create', () => {
    it('gera slug com sufixo quando o título se repete', async () => {
      prisma.announcement.findMany.mockResolvedValue([
        { slug: 'missa-de-natal' },
        { slug: 'missa-de-natal-2' },
      ]);
      prisma.announcement.create.mockResolvedValue({ id: 1 });

      await service.create(
        { title: 'Missa de Natal', content: 'x' },
        'user-1',
      );

      expect(prisma.announcement.create.mock.calls[0][0].data).toMatchObject({
        slug: 'missa-de-natal-3',
        authorId: 'user-1',
      });
    });

    it('slug automático: P2002 por corrida -> tenta de novo', async () => {
      prisma.announcement.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ slug: 'aviso' }]);
      prisma.announcement.create
        .mockRejectedValueOnce(p2002())
        .mockResolvedValueOnce({ id: 2 });

      await service.create({ title: 'Aviso', content: 'x' }, 'u');

      expect(prisma.announcement.create).toHaveBeenCalledTimes(2);
      expect(prisma.announcement.create.mock.calls[1][0].data.slug).toBe(
        'aviso-2',
      );
    });

    it('slug explícito duplicado -> 409', async () => {
      prisma.announcement.create.mockRejectedValue(p2002());
      await expect(
        service.create({ title: 'A', content: 'x', slug: 'a' }, 'u'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('título só com símbolos usa slug fallback', async () => {
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.create.mockResolvedValue({ id: 1 });
      await service.create({ title: '!!!', content: 'x' }, 'u');
      expect(prisma.announcement.create.mock.calls[0][0].data.slug).toBe(
        'comunicado',
      );
    });

    it('categoria de outro tipo -> 400', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1, type: 'EVENT' });
      await expect(
        service.create({ title: 'A', content: 'x', categoryId: 1 }, 'u'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.announcement.create).not.toHaveBeenCalled();
    });
  });

  describe('update / remove', () => {
    it('update de inexistente -> 404', async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);
      await expect(service.update(9, { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('update com categoryId null limpa sem validar categoria', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1 });
      prisma.announcement.update.mockResolvedValue({ id: 1 });
      await service.update(1, { categoryId: null });
      expect(prisma.category.findUnique).not.toHaveBeenCalled();
      expect(prisma.announcement.update.mock.calls[0][0].data).toEqual({
        categoryId: null,
      });
    });

    it('update com slug duplicado -> 409', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1 });
      prisma.announcement.update.mockRejectedValue(p2002());
      await expect(service.update(1, { slug: 'a' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('remove de inexistente -> 404', async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);
      await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.announcement.delete).not.toHaveBeenCalled();
    });
  });
});