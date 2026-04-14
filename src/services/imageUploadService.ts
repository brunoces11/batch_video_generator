import { supabase } from '../lib/supabase';

export interface UploadedImage {
  publicUrl: string;
  path: string;
}

export async function uploadReferenceImage(file: File): Promise<UploadedImage> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('reference-images')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('reference-images')
    .getPublicUrl(path);

  return { publicUrl: data.publicUrl, path };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
