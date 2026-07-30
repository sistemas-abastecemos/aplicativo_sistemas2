import { useState, useEffect, useCallback } from 'react';
import {
  enable as enableDarkReader,
  disable as disableDarkReader,
  setFetchMethod,
} from 'darkreader';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('seao_theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 1. Escuchar cambios del sistema operativo si el usuario NO ha guardado preferencia
  useEffect(() => {
    const savedTheme = localStorage.getItem('seao_theme');
    if (savedTheme !== null) return; // Si el usuario ya eligió, no escuchamos al sistema

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 2. Aplicar o remover DarkReader según el estado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fetch) {
      setFetchMethod(window.fetch);
    }

    if (isDark) {
      enableDarkReader({
        brightness: 100,
        contrast: 90,
        sepia: 0,
      });
    } else {
      disableDarkReader();
    }
  }, [isDark]);

  // 3. Función de alternancia que guarda la decisión del usuario
  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const nextState = !prev;
      localStorage.setItem('seao_theme', nextState ? 'dark' : 'light');
      return nextState;
    });
  }, []);

  return { isDark, toggleDarkMode };
};