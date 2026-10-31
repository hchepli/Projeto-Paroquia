// Contrato comum dos providers (R2, Cloudinary, futuros).
// O StorageService entrega dados neutros; cada provider monta sua própria
// chave (ex: R2 precisa da extensão, Cloudinary acrescenta sozinho).

export interface UploadInput {
  buffer: Buffer;
  /** Pasta lógica, ex: "albums/3" */
  folder: string;
  /** Identificador único sem extensão (UUID) */
  id: string;
  /** Extensão do formato DETECTADO no conteúdo: "jpg" | "png" | "webp" */
  extension: string;
  mimetype: string;
}

export interface StorageProvider {
  /** Envia o arquivo e retorna a URL pública final. */
  upload(input: UploadInput): Promise<string>;

  /**
   * Remove o arquivo a partir da URL salva no banco.
   * Deve LANÇAR erro se não conseguir apagar (o chamador registra ORPHAN_FILE).
   */
  deleteByUrl(url: string): Promise<void>;
}