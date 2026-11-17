// Limites de upload. O back (photos.controller.ts) é quem realmente barra;
// aqui só avisamos antes de enviar.
export const MAX_PHOTO_SIZE_MB = 5;
export const MAX_PHOTO_SIZE = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_HELP_TEXT = `Fotos JPG, PNG ou WEBP, até ${MAX_PHOTO_SIZE_MB} MB cada.`;

// Hosts liberados no next.config.ts (images.remotePatterns).
// Mantenha as duas listas iguais. Se usar R2, acrescente o hostname do R2_PUBLIC_URL.
const ALLOWED_IMAGE_HOSTS = ['res.cloudinary.com'];

/** Evita derrubar a tela quando a URL da foto é de um host não liberado (ex: dados de teste). */
export function canShowImage(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return ALLOWED_IMAGE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}