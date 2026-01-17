import { getOptimizedImageUrl, type CloudinaryTransformOptions } from "~/lib/cloudinary";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  crop?: CloudinaryTransformOptions['crop'];
  quality?: CloudinaryTransformOptions['quality'];
  sizes?: string;
  priority?: boolean;
}

/**
 * Optimized image component that automatically applies Cloudinary transformations
 * for better performance and bandwidth savings.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  crop = 'fill',
  quality = 'auto',
  className,
  sizes,
  priority = false,
  ...props
}: OptimizedImageProps) {
  // Generate optimized URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    crop,
    quality,
    format: 'auto',
    dpr: 'auto'
  });

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;

    const widths = [0.5, 1, 1.5, 2].map(multiplier => Math.round(width * multiplier));

    return widths
      .map(w => {
        const url = getOptimizedImageUrl(src, {
          width: w,
          height: height ? Math.round(height * (w / width)) : undefined,
          crop,
          quality,
          format: 'auto'
        });
        return `${url} ${w}w`;
      })
      .join(', ');
  };

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      srcSet={generateSrcSet()}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={className}
      {...props}
    />
  );
}
