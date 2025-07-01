import { useCallback, useRef } from 'react';

export function useAnimationFrame() {
  const frameRef = useRef<number>();

  const requestFrame = useCallback((callback: () => void) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(callback);
  }, []);

  const cancelFrame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    }
  }, []);

  return { requestFrame, cancelFrame };
}