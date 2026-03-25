import { useEffect, useState, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { lightTheme, darkTheme } from './tokens';
import AsyncStorage from '@/lib/async-storage';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'themeMode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  const activeTheme = useMemo(() => {
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [mode]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && (stored === 'light' || stored === 'dark')) {
          setModeState(stored);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    if (!newMode || (newMode !== 'light' && newMode !== 'dark')) {
      return;
    }
    
    setModeState(newMode);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  return useMemo(() => ({ mode, activeTheme, setMode, isLoaded }), [mode, activeTheme, setMode, isLoaded]);
});