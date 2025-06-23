"use client";

import React, { useState } from "react";
import Image from 'next/image'

function ImageWithFallback({ src, alt, ...props }) {
  const [error, setError] = useState(false);

  if (error) {
    return <div className="placeholder-image">{alt}</div>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={400}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default ImageWithFallback;