const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Selecciona una imagen JPG, PNG, WebP o GIF.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('La imagen no puede superar los 4 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) {
    throw new Error(result.error || 'No se pudo guardar la imagen del producto.');
  }
  return result.url;
}

export const uploadProductImageContext = uploadProductImage;
export const uploadProductImageDev = uploadProductImage;
export const uploadProductImageSafe = uploadProductImage;
