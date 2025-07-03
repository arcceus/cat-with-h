import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>('light'); // Default to light for SSR
  const [mounted, setMounted] = useState(false);

  // Initialize theme after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      } else {
        // Check system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDark ? 'dark' : 'light');
      }
    } catch {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [theme]);

  return [theme, setTheme];
}