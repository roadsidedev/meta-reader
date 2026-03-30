import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for observing element resize events.
 * Uses ResizeObserver API for better performance than window resize events.
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void,
  options?: ResizeObserverOptions
) {
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Create ResizeObserver
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry);
      }
    });

    // Start observing
    observerRef.current.observe(ref.current, options);

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref, callback, options]);
}

/**
 * Hook for tracking window resize events with debouncing.
 */
export function useWindowResize(callback: () => void, debounceMs: number = 200) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(callback, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, debounceMs]);
}

/**
 * Hook for tracking device orientation changes.
 */
export function useOrientation(callback: (orientation: 'portrait' | 'landscape') => void) {
  useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      callback(orientation);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Call immediately with current orientation
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [callback]);
}
