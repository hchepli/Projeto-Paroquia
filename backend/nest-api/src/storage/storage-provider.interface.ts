// src/storage/storage-provider.interface.ts
//
// Contrato comum que qualquer provider de storage (R2, Cloudinary, ou
// futuramente outro) precisa implementar. O StorageService depende só
// desta interface, nunca de um SDK específico.

export interface StorageProvider {
  /**
   * Envia o arquivo para o storage e retorna a URL pública final.
   * @param buffer   Conteúdo do arquivo (memoryStorage do multer, sem tocar disco)
   * @param key      Identificador único do objeto, ex: "albums/3/uuid-foto.jpg"
   * @param mimetype Content-Type do arquivo (ex: image/jpeg)
   */
  upload(buffer: Buffer, key: string, mimetype: string): Promise<string>;

  /**
   * Remove o arquivo do storage a partir da URL pública salva no banco
   * (cada provider sabe extrair seu próprio identificador dessa URL).
   */
  deleteByUrl(url: string): Promise<void>;
}
