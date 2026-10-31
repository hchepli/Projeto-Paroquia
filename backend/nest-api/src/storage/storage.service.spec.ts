import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { StorageService } from './storage.service';
import { R2StorageProvider } from './providers/r2-storage.provider';

jest.mock('./providers/r2-storage.provider');
jest.mock('./providers/cloudinary-storage.provider');

const img = (fmt: 'jpeg' | 'png' | 'webp' | 'tiff', width = 10, height = 10) =>
  sharp({
    create: { width, height, channels: 3, background: '#ff0000' },
  })
    [fmt]()
    .toBuffer();

describe('StorageService (RNF008/RNF009)', () => {
  let service: StorageService;
  let provider: any;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.STORAGE_PROVIDER = 'r2';
    service = new StorageService();
    provider = (R2StorageProvider as unknown as jest.Mock).mock.instances[0];
    provider.upload.mockResolvedValue('https://cdn/x');
    provider.deleteByUrl.mockResolvedValue(undefined);
  });

  it('STORAGE_PROVIDER inválido falha no boot', () => {
    process.env.STORAGE_PROVIDER = 'foo';
    expect(() => new StorageService()).toThrow(/inválido/);
  });

  it.each([
    ['jpeg', 'image/jpeg', 'jpg'],
    ['png', 'image/png', 'png'],
    ['webp', 'image/webp', 'webp'],
  ] as const)('%s válido sobe com UUID + extensão detectada', async (fmt, mime, ext) => {
    const url = await service.uploadFile(await img(fmt), 'albums/1', 'qualquer nome ç.xyz', mime);

    expect(url).toBe('https://cdn/x');
    const input = provider.upload.mock.calls[0][0];
    expect(input.folder).toBe('albums/1');
    expect(input.extension).toBe(ext);
    expect(input.mimetype).toBe(mime);
    expect(input.id).toMatch(/^[0-9a-f-]{36}$/); // nome do cliente ignorado
  });

  it('redimensiona imagens maiores que 1920px (só encolhe)', async () => {
    await service.uploadFile(await img('png', 3000, 100), 'albums/1', 'a.png', 'image/png');
    const out = await sharp(provider.upload.mock.calls[0][0].buffer).metadata();
    expect(out.width).toBe(1920);
  });

  it('não amplia imagens pequenas', async () => {
    await service.uploadFile(await img('jpeg', 100, 100), 'albums/1', 'a.jpg', 'image/jpeg');
    const out = await sharp(provider.upload.mock.calls[0][0].buffer).metadata();
    expect(out.width).toBe(100);
  });

  it('rejeita arquivo que não é imagem', async () => {
    await expect(
      service.uploadFile(Buffer.from('%PDF-1.4'), 'albums/1', 'a.jpg', 'image/jpeg'),
    ).rejects.toThrow(BadRequestException);
    expect(provider.upload).not.toHaveBeenCalled();
  });

  it('rejeita formato fora da whitelist (TIFF)', async () => {
    await expect(
      service.uploadFile(await img('tiff'), 'albums/1', 'a.jpg', 'image/jpeg'),
    ).rejects.toThrow(BadRequestException);
    expect(provider.upload).not.toHaveBeenCalled();
  });

  it('rejeita MIME declarado diferente do conteúdo', async () => {
    await expect(
      service.uploadFile(await img('png'), 'albums/1', 'a.jpg', 'image/jpeg'),
    ).rejects.toThrow(BadRequestException);
    expect(provider.upload).not.toHaveBeenCalled();
  });

  it('deleteFile delega ao provider', async () => {
    await service.deleteFile('https://cdn/albums/1/x.jpg');
    expect(provider.deleteByUrl).toHaveBeenCalledWith('https://cdn/albums/1/x.jpg');
  });
});