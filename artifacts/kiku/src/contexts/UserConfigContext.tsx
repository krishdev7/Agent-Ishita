import { createContext, useContext, useState, ReactNode } from 'react';

export type AIEngine = 'groq' | 'gemini';

export interface UserConfig {
  displayName: string;
  avatarInitial: string;
  avatarColorFrom: string;
  avatarColorTo: string;
  bannerColor: string;
  engine: AIEngine;
}

interface UserConfigContextValue {
  config: UserConfig;
  setConfig: (partial: Partial<UserConfig>) => void;
}

const DEFAULT_CONFIG: UserConfig = {
  displayName: 'Ishita',
  avatarInitial: 'I',
  avatarColorFrom: 'rgba(0,212,170,0.25)',
  avatarColorTo: 'rgba(59,139,235,0.25)',
  bannerColor: '#070a10',
  engine: 'groq',
};

const UserConfigContext = createContext<UserConfigContextValue | null>(null);

export function UserConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<UserConfig>(DEFAULT_CONFIG);

  const setConfig = (partial: Partial<UserConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <UserConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </UserConfigContext.Provider>
  );
}

export function useUserConfig() {
  const ctx = useContext(UserConfigContext);
  if (!ctx) throw new Error('useUserConfig must be used inside UserConfigProvider');
  return ctx;
}
