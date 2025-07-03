import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue); // Use initial value for SSR
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // For layout-related values, validate they're reasonable
        if (key === 'leftPanelWidth' && typeof parsed === 'number') {
          if (parsed > 0 && parsed < 10000) {
            setStoredValue(parsed as T);
          }
        } else {
          setStoredValue(parsed as T);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T) => {
    setStoredValue(value);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}