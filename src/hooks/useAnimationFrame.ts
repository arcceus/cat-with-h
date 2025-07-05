import { useRef, useEffect } from 'react';

export function useAnimationFrame() {
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, []);
}