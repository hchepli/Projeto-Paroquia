import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('dup', {
    code: 'P2002',
    clientVersion: 'x',
  });

describe('AlbumsService', () => {
  let service: AlbumsService;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    prisma = {
      album: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      event: { findUnique: jest.fn() },
      photo: { findMany: jest.fn() },
    };
    storage = { deleteFile: jest.fn() };

    const mod = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = mod.get(AlbumsService);

    prisma.album.create.mockImplementation(({ data }: any) => ({ id: 1, ...data }));
  });

  describe('create / slug', () => {
    it('gera slug a partir do título', async () => {
      prisma.album.findMany.mockResolvedValue([]);
      const r = await service.create({ title: 'Festa Junina' });
      expect(r.slug).toBe('festa-junina');
    });

    it('usa sufixo -2 quando o slug já existe (sem 409)', async () => {
      prisma.album.findMany.mockResolvedValue([{ slug: 'festa-junina' }]);
      const r = await service.create({ title: 'Festa Junina' });
      expect(r.slug).toBe('festa-junina-2');
    });

    it('retenta quando outra request pegou o slug (P2002)', async () => {
      prisma.album.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ slug: 'festa-junina' }]);
      prisma.album.create
        .mockRejectedValueOnce(p2002())
        .mockImplementationOnce(({ data }: any) => ({ id: 1, ...data }));
      const r = await service.create({ title: 'Festa Junina' });
      expect(r.slug).toBe('festa-junina-2');
      expect(prisma.album.create).toHaveBeenCalledTimes(2);
    });

    it('slug explícito duplicado dá 409', async () => {
      prisma.album.create.mockRejectedValue(p2002());
      await expect(
        service.create({ title: 'X', slug: 'x' }),
      ).rejects.toThrow(ConflictException);
    });

    it('400 se o evento informado não existe (RN003)', async () => {
      prisma.event.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'X', eventId: 99 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('devolve contagem, capa e nome do evento', async () => {
      prisma.album.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'A',
          event: { id: 3, name: 'Festa' },
          _count: { photos: 4 },
          photos: [{ url: 'https://cdn/c.jpg' }],
        },
      ]);
      const [a] = await service.findAll();
      expect(a).toMatchObject({
        photoCount: 4,
        coverUrl: 'https://cdn/c.jpg',
        eventName: 'Festa',
      });
      expect(a).not.toHaveProperty('photos');
    });
  });

  describe('remove (UC029)', () => {
    it('apaga todos os arquivos e tolera falha de storage', async () => {
      prisma.album.findUnique.mockResolvedValue({ id: 1 });
      prisma.photo.findMany.mockResolvedValue([
        { id: 1, url: 'u1' },
        { id: 2, url: 'u2' },
      ]);
      prisma.album.delete.mockResolvedValue({ id: 1 });
      storage.deleteFile
        .mockRejectedValueOnce(new Error('falhou'))
        .mockResolvedValueOnce(undefined);

      await expect(service.remove(1)).resolves.toEqual({ id: 1 });
      expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    });
  });
});