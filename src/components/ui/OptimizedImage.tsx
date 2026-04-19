import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export function OptimizedImage({ src, alt, className = "", ...props }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If the image is already a data URI or local static asset, return as is.
  // Otherwise, use a global managed CDN proxy (weserv.nl) for automatic WebP conversion and responsive sizing.
  const isExternal = src.startsWith("http");
  
  // Format proxy URLs for 1x and 2x pixel densities
  const getProxyUrl = (url: string, width: number) => {
    // Encodes the source URL without its protocol for weserv
    const cleanUrl = url.replace(/.*?:\/\//g, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&af=1&fit=cover`;
  };

  const cdnUrl = isExternal ? getProxyUrl(src, 800) : src;
  const srcSet = isExternal ? `${getProxyUrl(src, 400)} 400w, ${getProxyUrl(src, 800)} 800w, ${getProxyUrl(src, 1200)} 1200w` : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={error ? src : cdnUrl} // Fallback to raw src if CDN fails
        srcSet={error ? undefined : srcSet}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
