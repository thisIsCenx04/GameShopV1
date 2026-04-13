import { api } from './api';

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Get signed upload params from our backend
 */
async function getUploadSignature(): Promise<UploadSignature> {
  const { data } = await api.post('/upload/sign');
  return data.data;
}

/**
 * Upload a file directly to Cloudinary CDN using signed params
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const sig = await getUploadSignature();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }

  return res.json();
}

/**
 * Build optimized Cloudinary URL with auto format/quality
 */
export function cloudinaryUrl(publicIdOrUrl: string, options?: { width?: number; height?: number; crop?: string }): string {
  // If it's already a full URL, return as-is
  if (publicIdOrUrl.startsWith('http')) return publicIdOrUrl;

  const transforms = ['f_auto', 'q_auto'];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicIdOrUrl}`;
}
