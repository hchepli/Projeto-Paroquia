import { Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { destroy: jest.fn(), upload_stream: jest.fn() },
  },
}));

const CLOUD = 'democloud';
const base = `https://res.cloudinary.com/${CLOUD}/image/upload`;

describe('CloudinaryStorageProvider', () => {
  let provider: CloudinaryStorageProvider;
  const uploader = cloudinary.uploader as unknown as {
    destroy: jest.Mock;
    upload_stream: jest.Mock;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    process.env.CLOUDINARY_CLOUD_NAME = CLOUD;
    process.env.CLOUDINARY_API_KEY = 'k';
    process.env.CLOUDINARY_API_SECRET = 's';
    provider = new CloudinaryStorageProvider();
  });

  it('falha no boot se faltar variável de ambiente', () => {
    delete process.env.CLOUDINARY_API_SECRET;
    expect(() => new CloudinaryStorageProvider()).toThrow(
      /CLOUDINARY_API_SECRET/,
    );
  });

  describe('extractPublicId', () => {
    it.each([
      [`${base}/v123/albums/3/abc.jpg`, 'albums/3/abc'],
      [`${base}/albums/3/abc.png`, 'albums/3/abc'],
      // URL antiga (extensão dupla): remove só a última
      [`${base}/v123/albums/2/uuid-foto.jpeg.jpg`, 'albums/2/uuid-foto.jpeg'],
    ])('%s -> %s', (url, expected) => {
      expect(provider.extractPublicId(url)).toBe(expected);
    });

    it('lança se a URL não tem /upload/', () => {
      expect(() => provider.extractPublicId('https://x.com/a.jpg')).toThrow();
    });
  });

  describe('upload', () => {
    it('envia public_id SEM extensão e devolve a secure_url', async () => {
      uploader.upload_stream.mockImplementation((_opts, cb) => ({
        end: () => cb(undefined, { secure_url: `${base}/v1/albums/1/id1.jpg` }),
      }));

      const url = await provider.upload({
        buffer: Buffer.from('x'),
        folder: 'albums/1',
        id: 'id1',
        extension: 'jpg',
        mimetype: 'image/jpeg',
      });

      expect(url).toBe(`${base}/v1/albums/1/id1.jpg`);
      expect(uploader.upload_stream.mock.calls[0][0].public_id).toBe('albums/1/id1');
    });

    it('rejeita se o Cloudinary devolver erro', async () => {
      uploader.upload_stream.mockImplementation((_opts, cb) => ({
        end: () => cb(new Error('boom'), undefined),
      }));
      await expect(
        provider.upload({
          buffer: Buffer.from('x'),
          folder: 'a',
          id: 'b',
          extension: 'jpg',
          mimetype: 'image/jpeg',
        }),
      ).rejects.toThrow('boom');
    });
  });

  describe('deleteByUrl', () => {
    const url = `${base}/v1/albums/1/id1.jpg`;

    it('ok -> resolve', async () => {
      uploader.destroy.mockResolvedValue({ result: 'ok' });
      await expect(provider.deleteByUrl(url)).resolves.toBeUndefined();
      expect(uploader.destroy.mock.calls[0][0]).toBe('albums/1/id1');
    });

    it('not found -> resolve (já não existe), sem gerar ORPHAN_FILE', async () => {
      uploader.destroy.mockResolvedValue({ result: 'not found' });
      await expect(provider.deleteByUrl(url)).resolves.toBeUndefined();
    });

    it('qualquer outro resultado -> lança (vira ORPHAN_FILE no chamador)', async () => {
      uploader.destroy.mockResolvedValue({ result: 'error' });
      await expect(provider.deleteByUrl(url)).rejects.toThrow(/error/);
    });

    it('URL de outro cloud -> lança e NÃO chama destroy', async () => {
      await expect(
        provider.deleteByUrl('https://res.cloudinary.com/outro/image/upload/v1/a/b.jpg'),
      ).rejects.toThrow();
      expect(uploader.destroy).not.toHaveBeenCalled();
    });
  });
});