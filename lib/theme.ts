export const LIGHT_COLORS = {
  background: 'hsl(225, 40%, 99%)',

  card: 'hsl(0, 0%, 100%)',

  muted: 'hsl(225, 25%, 95%)',

  foreground: 'hsl(240, 10%, 4%)',

  mutedForeground: 'hsl(225, 5%, 45%)',

  primary: 'hsl(224, 76%, 55%)',

  primaryForeground: 'hsl(0, 0%, 98%)',

  destructive: 'hsl(358, 75%, 55%)',

  border: 'hsl(225, 30%, 90%)',

  white: '#ffffff',
} as const;

export const DARK_COLORS = {
  background: 'hsl(225, 25%, 10%)',
  card: 'hsl(225, 22%, 14%)',
  muted: 'hsl(225, 15%, 22%)',
  foreground: 'hsl(0, 0%, 98%)',
  mutedForeground: 'hsl(225, 10%, 65%)',
  primary: 'hsl(224, 70%, 62%)',
  primaryForeground: 'hsl(225, 25%, 10%)',
  destructive: 'hsl(358, 65%, 55%)',
  border: 'hsl(225, 15%, 24%)',
  white: '#ffffff',
} as const;

export const THEME_COLORS = LIGHT_COLORS;

export type ThemeColorKey = keyof typeof LIGHT_COLORS;
