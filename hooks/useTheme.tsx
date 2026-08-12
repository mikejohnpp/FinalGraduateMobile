import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'nativewind';
import { storage } from '@/lib/storage';
import { LIGHT_COLORS, DARK_COLORS } from '@/lib/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'fg-theme';

interface ThemeContextValue {
  preference: ThemePreference;

  resolvedTheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
  hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = (await storage.get(THEME_STORAGE_KEY)) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
        setColorScheme(saved);
      }
      setHydrated(true);
    })();
  }, [setColorScheme]);

  const resolvedTheme: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    setColorScheme(pref);
    storage.set(THEME_STORAGE_KEY, pref);
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme phải được dùng bên trong <ThemeProvider>');
  }
  return ctx;
}

export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}
