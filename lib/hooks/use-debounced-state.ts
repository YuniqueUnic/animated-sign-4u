import { useEffect, useMemo, useRef } from "react";

/**
 * Custom hook for debouncing callback functions
 * Useful for expensive operations like SVG re-rendering
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 100)
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 100,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFn = useMemo(() => {
    const func = (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    };
    return func as T;
  }, [delay]);

  return debouncedFn;
}
