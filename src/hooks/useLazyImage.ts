import { useEffect, useRef, useState } from "react";

interface UseLazyImageOptions {
  /** Pixels before element enters viewport to start loading */
  rootMargin?: string;
  /** Whether this is a critical image (above the fold — skip lazy) */
  eager?: boolean;
}

/**
 * Returns a ref to attach to a container element and the resolved src.
 * The image only starts loading when the container approaches the viewport.
 */
export const useLazyImage = (
  src: string | null | undefined,
  { rootMargin = "200px", eager = false }: UseLazyImageOptions = {}
) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(
    eager && src ? src : null
  );
  const [isLoaded, setIsLoaded] = useState(eager && !!src);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!src || eager) return;

    const el = containerRef.current;
    if (!el) return;

    // IntersectionObserver: start loading when near viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadedSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, rootMargin, eager]);

  const onLoad = () => setIsLoaded(true);

  return { containerRef, loadedSrc, isLoaded, onLoad };
};
