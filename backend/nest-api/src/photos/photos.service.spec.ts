import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';

const file = {
  buffer: Buffer.from('x'),
  mimetype: 'image/jpeg',
  originalname: 'a.jpg',
};

describe('PhotosService', () => {
  let service: PhotosService;
  let tx: any;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    tx = {
      photo: {
        count: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    prisma = {
      album: { findUnique: jest.fn() },
      photo: { findMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(tx)),
    };
    storage = { uploadFile: jest.fn(), deleteFile: jest.fn() };

    const mod = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = mod.get(PhotosService);

    prisma.album.findUnique.mockResolvedValue({ id: 1 });
    storage.uploadFile.mockResolvedValue('https://cdn/albums/1/x.jpg');
    storage.deleteFile.mockResolvedValue(undefined);
    tx.photo.create.mockImplementation(({ data }: any) => ({ id: 10, ...data }));
  });

  describe('create', () => {
    it('404 e sem upload se o álbum não existe', async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      await expect(service.create({ albumId: 1 }, file)).rejects.toThrow(
        NotFoundException,
      );
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('1ª foto do álbum vira capa (RN010)', async () => {
      tx.photo.count.mockResolvedValue(0);
      const r = await service.create({ albumId: 1 }, file);
      expect(r.isCover).toBe(true);
    });

    it('isCover=true desmarca a capa anterior (RN010)', async () => {
      tx.photo.count.mockResolvedValue(1);
      const r = await service.create({ albumId: 1, isCover: true }, file);
      expect(tx.photo.updateMany).toHaveBeenCalledWith({
        where: { albumId: 1, isCover: true },
        data: { isCover: false },
      });
      expect(r.isCover).toBe(true);
    });

    it('com capa existente e sem pedir capa, não mexe na capa', async () => {
      tx.photo.count.mockResolvedValue(1);
      const r = await service.create({ albumId: 1 }, file);
      expect(tx.photo.updateMany).not.toHaveBeenCalled();
      expect(r.isCover).toBe(false);
    });

    it('falha no banco apaga o arquivo enviado (sem órfão)', async () => {
      tx.photo.count.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk', {
          code: 'P2003',
          clientVersion: 'x',
        }),
      );
      await expect(service.create({ albumId: 1 }, file)).rejects.toThrow(
        NotFoundException,
      );
      expect(storage.deleteFile).toHaveBeenCalledWith(
        'https://cdn/albums/1/x.jpg',
      );
    });
  });

  describe('update', () => {
    it('400 ao tentar desmarcar capa', async () => {
      prisma.photo.findUnique.mockResolvedValue({ id: 1, albumId: 1, isCover: true });
      await expect(service.update(1, { isCover: false })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('troca a capa desmarcando a anterior', async () => {
      prisma.photo.findUnique.mockResolvedValue({ id: 2, albumId: 1, isCover: false });
      tx.photo.update.mockResolvedValue({ id: 2, isCover: true });
      await service.update(2, { isCover: true });
      expect(tx.photo.updateMany).toHaveBeenCalled();
      expect(tx.photo.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isCover: true },
      });
    });
  });

  describe('remove', () => {
    const cover = { id: 1, albumId: 1, url: 'https://cdn/u.jpg', isCover: true };

    it('promove a foto mais antiga quando remove a capa', async () => {
      prisma.photo.findUnique.mockResolvedValue(cover);
      tx.photo.delete.mockResolvedValue(cover);
      tx.photo.findFirst.mockResolvedValue({ id: 2 });
      await service.remove(1);
      expect(tx.photo.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isCover: true },
      });
      expect(storage.deleteFile).toHaveBeenCalledWith(cover.url);
    });

    it('falha no storage não quebra a resposta', async () => {
      prisma.photo.findUnique.mockResolvedValue({ ...cover, isCover: false });
      tx.photo.delete.mockResolvedValue(cover);
      storage.deleteFile.mockRejectedValue(new Error('r2 off'));
      await expect(service.remove(1)).resolves.toBeDefined();
    });
  });
});