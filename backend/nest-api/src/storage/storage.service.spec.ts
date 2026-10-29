import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { StorageService } from './storage.service';
import { R2StorageProvider } from './providers/r2-storage.provider';

jest.mock('./providers/r2-storage.provider');
jest.mock('./providers/cloudinary-storage.provider');

const img = (fmt: 'jpeg' | 'png' | 'tiff') =>
  sharp({
    create: { width: 10, height: 10, channels: 3, background: '#ff0000' },
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
  });

  it('JPEG válido sobe com key sanitizada', async () => {
    const url = await service.uploadFile(
      await img('jpeg'),
      'albums/1',
      'foto ç.jpg',
      'image/jpeg',
    );
    expect(url).toBe('https://cdn/x');
    expect(provider.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/^albums\/1\/.+-foto__\.jpg$/),
      'image/jpeg',
    );
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
});