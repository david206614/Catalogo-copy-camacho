import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Optimizes/resizes an image file in the browser before uploading.
 * Max dimension 1200px, WebP quality 0.85.
 */
export async function optimizeImage(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Converts a File or Blob into a Base64 Data URL for instant preview or offline storage.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image file to Supabase Storage ('product-images' bucket),
 * with automatic fallback to base64 Data URL if storage is unconfigured or offline.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const optimizedBlob = await optimizeImage(file);
  const isSvg = file.type === 'image/svg+xml';
  const ext = isSvg ? 'svg' : 'webp';
  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `prod_${Date.now()}_${cleanName.slice(0, 15)}.${ext}`;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, optimizedBlob, {
          contentType: isSvg ? 'image/svg+xml' : 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase Storage: bucket product-images no disponible, usando fallback local.', error.message);
      }
    } catch (err) {
      console.warn('Supabase Storage exception, usando fallback local:', err);
    }
  }

  // Fallback to base64 Data URL
  return fileToDataUrl(optimizedBlob);
}
