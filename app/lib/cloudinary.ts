/**
 * Cloudinary URL utilities for optimized image delivery
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
  quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  dpr?: 'auto' | number;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Extract cloud name and public ID from a Cloudinary URL
 */
export function parseCloudinaryUrl(url: string): { cloudName: string; publicId: string } | null {
  // Format: https://res.cloudinary.com/CLOUD_NAME/image/upload/[transformations/]PUBLIC_ID
  const match = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)/);
  if (!match) return null;

  let publicId = match[2];
  // Remove file extension if present
  publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, '');
  // Remove any existing transformations (they start after upload/ and before the actual path)
  const parts = publicId.split('/');
  // Check if first part looks like a transformation (contains underscore or comma)
  if (parts[0] && (parts[0].includes('_') || parts[0].includes(','))) {
    parts.shift();
    publicId = parts.join('/');
  }

  return { cloudName: match[1], publicId };
}

/**
 * Generate an optimized Cloudinary URL with transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options: CloudinaryTransformOptions = {}
): string {
  // If not a Cloudinary URL, return as-is
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return url;

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto'
  } = options;

  // Build transformation string
  const transforms: string[] = [];

  // Always use auto format and quality for optimization
  transforms.push(`f_${format}`);
  transforms.push(`q_${quality}`);

  // Add DPR for retina displays
  if (dpr) {
    transforms.push(`dpr_${dpr}`);
  }

  // Add dimensions if specified
  if (width) {
    transforms.push(`w_${width}`);
  }
  if (height) {
    transforms.push(`h_${height}`);
  }

  // Add crop mode if dimensions are specified
  if (width || height) {
    transforms.push(`c_${crop}`);
  }

  const transformString = transforms.join(',');

  return `https://res.cloudinary.com/${parsed.cloudName}/image/upload/${transformString}/${parsed.publicId}`;
}

/**
 * Pre-defined image sizes for common use cases
 */
export const imageSizes = {
  thumbnail: { width: 150, height: 150, crop: 'thumb' as const },
  card: { width: 400, height: 400, crop: 'fill' as const },
  medium: { width: 800, crop: 'scale' as const },
  large: { width: 1200, crop: 'scale' as const },
  full: { quality: 'auto' as const, format: 'auto' as const }
};

/**
 * Get optimized URL for a specific size preset
 */
export function getImageUrl(url: string, size: keyof typeof imageSizes): string {
  return getOptimizedImageUrl(url, imageSizes[size]);
}
