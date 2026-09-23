"use client";

import Image from "next/image";
import { useState } from "react";

import { ImageOffIcon } from "@/components/ui/icons";

/**
 * Product thumbnail.
 *
 * Two failure modes are handled here rather than in every caller:
 *   - a locally created product has no image at all (`src === ""`);
 *   - a remote URL can 404, which would otherwise render a broken image icon.
 *
 * Both fall back to the same neutral placeholder. The wrapper must always be
 * given a fixed size (e.g. `className="size-12"`), because `next/image` with
 * `fill` sizes itself from the parent.
 */

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Responsive sizes hint passed through to next/image. */
  sizes?: string;
  priority?: boolean;
  imageClassName?: string;
}

export function ProductImage({
  src,
  alt,
  className,
  sizes = "64px",
  priority = false,
  imageClassName,
}: ProductImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  const wrapper = ["relative shrink-0 overflow-hidden bg-slate-100", className]
    .filter(Boolean)
    .join(" ");

  if (!src || hasFailed) {
    return (
      <div className={`${wrapper} flex items-center justify-center`} aria-label={alt} role="img">
        <ImageOffIcon className="size-4 text-slate-400" />
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setHasFailed(true)}
        className={["object-cover", imageClassName].filter(Boolean).join(" ")}
      />
    </div>
  );
}
