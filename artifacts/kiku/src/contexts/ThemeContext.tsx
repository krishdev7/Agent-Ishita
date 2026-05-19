import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'obsidian' | 'cyberpunk' | 'custom';

export interface ThemeConfig {
  name: ThemeName;
  customAccent: string;
}

interface ThemeContextValue {
  theme: ThemeConfig;
  setThemeName: (name: ThemeName) => void;
  setCustomAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

type CSSVarMap = Record<string, string>;

const THEMES: Record<ThemeName, CSSVarMap> = {
  obsidian: {
    '--bg-base': '#050507',
    '--bg-surface': '#0a0a0c',
    '--bg-elevated': '#111113',
    '--glass-border': 'rgba(255, 255, 255, 0.05)',
    '--glass-bg': 'rgba(10, 10, 12, 0.82)',
    '--glass-header-bg': 'rgba(5, 5, 7, 0.92)',
    '--neon-teal': '#9090a8',
    '--neon-teal-dim': 'rgba(144, 144, 168, 0.12)',
    '--neon-teal-glow': 'rgba(144, 144, 168, 0.3)',
    '--neon-blue': '#606080',
    '--neon-blue-dim': 'rgba(96, 96, 128, 0.12)',
    '--user-bubble': 'rgba(96, 96, 128, 0.18)',
    '--user-bubble-border': 'rgba(96, 96, 128, 0.32)',
    '--kiku-bubble': 'rgba(255, 255, 255, 0.03)',
    '--kiku-bubble-border': 'rgba(144, 144, 168, 0.18)',
    '--text-primary': 'rgba(255, 255, 255, 0.9)',
    '--text-secondary': 'rgba(255, 255, 255, 0.45)',
    '--text-muted': 'rgba(255, 255, 255, 0.25)',
    '--online-color': '#9090a8',
    '--accent-focus': 'rgba(144, 144, 168, 0.4)',
    '--accent-focus-shadow': 'rgba(144, 144, 168, 0.07)',
    '--gradient-text-from': '#b0b0c8',
    '--gradient-text-to': '#606080',
  },
  cyberpunk: {
    '--bg-base': '#08000f',
    '--bg-surface': '#0e0020',
    '--bg-elevated': '#150030',
    '--glass-border': 'rgba(191, 0, 255, 0.14)',
    '--glass-bg': 'rgba(14, 0, 32, 0.85)',
    '--glass-header-bg': 'rgba(8, 0, 15, 0.93)',
    '--neon-teal': '#00e5ff',
    '--neon-teal-dim': 'rgba(0, 229, 255, 0.12)',
    '--neon-teal-glow': 'rgba(0, 229, 255, 0.38)',
    '--neon-blue': '#bf00ff',
    '--neon-blue-dim': 'rgba(191, 0, 255, 0.14)',
    '--user-bubble': 'rgba(191, 0, 255, 0.16)',
    '--user-bubble-border': 'rgba(191, 0, 255, 0.38)',
    '--kiku-bubble': 'rgba(0, 229, 255, 0.04)',
    '--kiku-bubble-border': 'rgba(0, 229, 255, 0.22)',
    '--text-primary': 'rgba(255, 255, 255, 0.95)',
    '--text-secondary': 'rgba(210, 180, 255, 0.55)',
    '--text-muted': 'rgba(210, 180, 255, 0.3)',
    '--online-color': '#00e5ff',
    '--accent-focus': 'rgba(0, 229, 255, 0.45)',
    '--accent-focus-shadow': 'rgba(0, 229, 255, 0.08)',
    '--gradient-text-from': '#00e5ff',
    '--gradient-text-to': '#bf00ff',
  },
  custom: {
    '--bg-base': '#070a10',
    '--bg-surface': '#0d1117',
    '--bg-elevated': '#121820',
    '--glass-border': 'rgba(255, 255, 255, 0.06)',
    '--glass-bg': 'rgba(13, 17, 23, 0.75)',
    '--glass-header-bg': 'rgba(7, 10, 16, 0.88)',
    '--neon-teal': '#00d4aa',
    '--neon-teal-dim': 'rgba(0, 212, 170, 0.15)',
    '--neon-teal-glow': 'rgba(0, 212, 170, 0.4)',
    '--neon-blue': '#3b8beb',
    '--neon-blue-dim': 'rgba(59, 139, 235, 0.12)',
    '--user-bubble': 'rgba(59, 139, 235, 0.18)',
    '--user-bubble-border': 'rgba(59, 139, 235, 0.35)',
    '--kiku-bubble': 'rgba(255, 255, 255, 0.04)',
    '--kiku-bubble-border': 'rgba(0, 212, 170, 0.25)',
    '--text-primary': 'rgba(255, 255, 255, 0.92)',
    '--text-secondary': 'rgba(255, 255, 255, 0.5)',
    '--text-muted': 'rgba(255, 255, 255, 0.3)',
    '--online-color': '#00d4aa',
    '--accent-focus': 'rgba(0, 212, 170, 0.45)',
    '--accent-focus-shadow': 'rgba(0, 212, 170, 0.07)',
    '--gradient-text-from': '#00d4aa',
    '--gradient-text-to': '#3b8beb',
  },
};

function hexToComponents(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const c = hexToComponents(hex);
  if (!c) return hex;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function applyCustomAccentOverrides(vars: CSSVarMap, accent: string): CSSVarMap {
  return {
    ...vars,
    '--neon-teal': accent,
    '--neon-teal-dim': rgba(accent, 0.15),
    '--neon-teal-glow': rgba(accent, 0.4),
    '--kiku-bubble-border': rgba(accent, 0.22),
    '--online-color': accent,
    '--accent-focus': rgba(accent, 0.45),
    '--accent-focus-shadow': rgba(accent, 0.07),
    '--gradient-text-from': accent,
  };
}

function applyThemeToDom(name: ThemeName, customAccent: string) {
  let vars = { ...THEMES[name] };
  if (name === 'custom') {
    vars = applyCustomAccentOverrides(vars, customAccent);
  }
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', name);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>({
    name: 'custom',
    customAccent: '#00d4aa',
  });

  useEffect(() => {
    applyThemeToDom(theme.name, theme.customAccent);
  }, [theme]);

  const setThemeName = (name: ThemeName) => {
    setTheme((prev) => ({ ...prev, name }));
  };

  const setCustomAccent = (color: string) => {
    setTheme({ name: 'custom', customAccent: color });
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeName, setCustomAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
