'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  ...rest
}: SafeImageProps) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  useEffect(() => {
    setErrorSrc(null);
  }, [src]);

  const displaySrc = errorSrc || src || fallbackSrc;

  return (
    <Image
      {...rest}
      src={displaySrc}
      alt={alt || 'Food item'}
      className={className}
      onError={() => {
        if (!errorSrc && fallbackSrc) {
          setErrorSrc(fallbackSrc);
        }
      }}
    />
  );
}
