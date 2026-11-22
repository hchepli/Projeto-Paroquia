import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('unique', {
    code: 'P2002',
    clientVersion: 'test',
  });

const file = {
  buffer: Buffer.from('x'),
  mimetype: 'image/jpeg',
  originalname: 'a.jpg',
};

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let prisma: any;
  let storage: any;
  let loggerError: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetAllMocks();
    loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    prisma = {
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
    storage = { uploadFile: jest.fn(), deleteFile: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = module.get(AnnouncementsService);

    storage.uploadFile.mockResolvedValue('https://cdn/announcements/new.jpg');
    storage.deleteFile.mockResolvedValue(undefined);
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

      await service.create({ title: 'Missa de Natal', content: 'x' }, 'user-1');

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

    it('categoria de outro tipo -> 400 e não sobe imagem', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1, type: 'EVENT' });
      await expect(
        service.create({ title: 'A', content: 'x', categoryId: 1 }, 'u', file),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.announcement.create).not.toHaveBeenCalled();
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('create com imagem', () => {
    beforeEach(() => {
      prisma.announcement.findMany.mockResolvedValue([]);
      prisma.announcement.create.mockResolvedValue({ id: 1 });
    });

    it('sobe a imagem na pasta announcements e grava a URL', async () => {
      await service.create({ title: 'Aviso', content: 'x' }, 'u', file);

      expect(storage.uploadFile).toHaveBeenCalledWith(
        file.buffer,
        'announcements',
        'a.jpg',
        'image/jpeg',
      );
      expect(prisma.announcement.create.mock.calls[0][0].data.imageUrl).toBe(
        'https://cdn/announcements/new.jpg',
      );
    });

    it('sem arquivo: não toca no storage e imageUrl fica null', async () => {
      await service.create({ title: 'Aviso', content: 'x' }, 'u');

      expect(storage.uploadFile).not.toHaveBeenCalled();
      expect(prisma.announcement.create.mock.calls[0][0].data.imageUrl).toBeNull();
    });

    it('imagem inválida (400 do storage) -> nada é gravado no banco', async () => {
      storage.uploadFile.mockRejectedValue(
        new BadRequestException('O arquivo enviado não é uma imagem válida.'),
      );
      await expect(
        service.create({ title: 'Aviso', content: 'x' }, 'u', file),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.announcement.create).not.toHaveBeenCalled();
    });

    it('rollback: se o banco falha, apaga o arquivo enviado', async () => {
      prisma.announcement.create.mockRejectedValue(new Error('db off'));

      await expect(
        service.create({ title: 'Aviso', content: 'x' }, 'u', file),
      ).rejects.toThrow('db off');

      expect(storage.deleteFile).toHaveBeenCalledTimes(1);
      expect(storage.deleteFile).toHaveBeenCalledWith(
        'https://cdn/announcements/new.jpg',
      );
    });

    it('rollback também no 409 de slug explícito duplicado', async () => {
      prisma.announcement.create.mockRejectedValue(p2002());

      await expect(
        service.create({ title: 'A', content: 'x', slug: 'a' }, 'u', file),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(storage.deleteFile).toHaveBeenCalledWith(
        'https://cdn/announcements/new.jpg',
      );
    });

    it('falha no deleteFile do rollback não esconde o erro original', async () => {
      prisma.announcement.create.mockRejectedValue(new Error('db off'));
      storage.deleteFile.mockRejectedValue(new Error('r2 off'));

      await expect(
        service.create({ title: 'Aviso', content: 'x' }, 'u', file),
      ).rejects.toThrow('db off');
      expect(loggerError).toHaveBeenCalled();
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

  describe('imagem no update', () => {
    const OLD = 'https://cdn/announcements/old.jpg';
    const NEW = 'https://cdn/announcements/new.jpg';

    beforeEach(() => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1, imageUrl: OLD });
      prisma.announcement.update.mockResolvedValue({ id: 1 });
    });

    it('removeImage limpa o campo, não vaza removeImage pro Prisma e apaga o arquivo', async () => {
      await service.update(1, { removeImage: true });

      const data = prisma.announcement.update.mock.calls[0][0].data;
      expect(data).toEqual({ imageUrl: null });
      expect(data).not.toHaveProperty('removeImage');
      expect(storage.uploadFile).not.toHaveBeenCalled();
      expect(storage.deleteFile).toHaveBeenCalledWith(OLD);
    });

    it('arquivo novo substitui a imagem e apaga a antiga DEPOIS do banco', async () => {
      await service.update(1, { title: 'Novo' }, file);

      expect(prisma.announcement.update.mock.calls[0][0].data).toMatchObject({
        title: 'Novo',
        imageUrl: NEW,
      });
      expect(storage.deleteFile).toHaveBeenCalledTimes(1);
      expect(storage.deleteFile).toHaveBeenCalledWith(OLD);
      expect(prisma.announcement.update.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteFile.mock.invocationCallOrder[0],
      );
    });

    it('arquivo novo vence removeImage', async () => {
      await service.update(1, { removeImage: true }, file);
      expect(prisma.announcement.update.mock.calls[0][0].data.imageUrl).toBe(NEW);
    });

    it('rollback: se o banco falha, apaga o arquivo NOVO e preserva o antigo', async () => {
      prisma.announcement.update.mockRejectedValue(new Error('db off'));

      await expect(service.update(1, { title: 'x' }, file)).rejects.toThrow(
        'db off',
      );

      expect(storage.deleteFile).toHaveBeenCalledTimes(1);
      expect(storage.deleteFile).toHaveBeenCalledWith(NEW);
      expect(storage.deleteFile).not.toHaveBeenCalledWith(OLD);
    });

    it('sem arquivo e sem removeImage: não mexe na imagem nem no storage', async () => {
      await service.update(1, { title: 'só título' });

      expect(
        prisma.announcement.update.mock.calls[0][0].data,
      ).not.toHaveProperty('imageUrl');
      expect(storage.deleteFile).not.toHaveBeenCalled();
    });

    it('removeImage sem imagem anterior não chama deleteFile', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1, imageUrl: null });
      await service.update(1, { removeImage: true });
      expect(storage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('imagem no remove', () => {
    it('apaga o registro no banco ANTES do arquivo', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1, imageUrl: 'u1' });
      prisma.announcement.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(storage.deleteFile).toHaveBeenCalledWith('u1');
      expect(prisma.announcement.delete.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteFile.mock.invocationCallOrder[0],
      );
    });

    it('sem imagem: não chama o storage', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 1, imageUrl: null });
      prisma.announcement.delete.mockResolvedValue({ id: 1 });
      await service.remove(1);
      expect(storage.deleteFile).not.toHaveBeenCalled();
    });

    it('falha no deleteFile não derruba a request e registra ORPHAN_FILE', async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: 7, imageUrl: 'u7' });
      prisma.announcement.delete.mockResolvedValue({ id: 7 });
      storage.deleteFile.mockRejectedValue(new Error('r2 off'));

      await expect(service.remove(7)).resolves.toEqual({ id: 7 });
      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('ORPHAN_FILE announcement=7 url=u7'),
        expect.any(String),
      );
    });
  });
});