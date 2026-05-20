import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getOrCreateProfileKey } from '@/lib/profileKey';

export type AIEngine = 'groq' | 'gemini';

export interface UserConfig {
  displayName: string;
  avatarInitial: string;
  avatarColorFrom: string;
  avatarColorTo: string;
  bannerColor: string;
  engine: AIEngine;
  avatarImageUrl: string;
  bannerImageUrl: string;
  bgImageUrl: string;
}

interface UserConfigContextValue {
  config: UserConfig;
  setConfig: (partial: Partial<UserConfig>) => void;
  profileKey: string;
}

const CONFIG_STORAGE_KEY = 'ketika_user_config_v1';

const DEFAULT_CONFIG: UserConfig = {
  displayName: 'Ketika',
  avatarInitial: 'K',
  avatarColorFrom: 'rgba(0,212,170,0.25)',
  avatarColorTo: 'rgba(59,139,235,0.25)',
  bannerColor: '#070a10',
  engine: 'groq',
  avatarImageUrl: '',
  bannerImageUrl: '',
  bgImageUrl: '',
};

function loadFromStorage(): UserConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function mapApiToConfig(data: Record<string, unknown>): Partial<UserConfig> {
  return {
    displayName: (data.displayName as string) || DEFAULT_CONFIG.displayName,
    avatarInitial: (data.avatarInitial as string) || DEFAULT_CONFIG.avatarInitial,
    avatarColorFrom: (data.avatarColorFrom as string) || DEFAULT_CONFIG.avatarColorFrom,
    avatarColorTo: (data.avatarColorTo as string) || DEFAULT_CONFIG.avatarColorTo,
    bannerColor: (data.bannerColor as string) || DEFAULT_CONFIG.bannerColor,
    engine: ((data.engine as AIEngine) || DEFAULT_CONFIG.engine),
    avatarImageUrl: (data.avatarImageUrl as string) ?? '',
    bannerImageUrl: (data.bannerImageUrl as string) ?? '',
    bgImageUrl: (data.bgImageUrl as string) ?? '',
  };
}

const UserConfigContext = createContext<UserConfigContextValue | null>(null);

export function UserConfigProvider({ children }: { children: ReactNode }) {
  const [profileKey] = useState(() => getOrCreateProfileKey());
  const [config, setConfigState] = useState<UserConfig>(loadFromStorage);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${profileKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (data) setConfigState((prev) => ({ ...prev, ...mapApiToConfig(data) }));
        setCloudLoaded(true);
      })
      .catch(() => setCloudLoaded(true));
  }, [profileKey]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    if (!cloudLoaded) return;
    const t = setTimeout(() => {
      fetch(`/api/profile/${profileKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: config.displayName,
          avatarInitial: config.avatarInitial,
          avatarColorFrom: config.avatarColorFrom,
          avatarColorTo: config.avatarColorTo,
          bannerColor: config.bannerColor,
          engine: config.engine,
          avatarImageUrl: config.avatarImageUrl || null,
          bannerImageUrl: config.bannerImageUrl || null,
          bgImageUrl: config.bgImageUrl || null,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [config, profileKey, cloudLoaded]);

  const setConfig = (partial: Partial<UserConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <UserConfigContext.Provider value={{ config, setConfig, profileKey }}>
      {children}
    </UserConfigContext.Provider>
  );
}

export function useUserConfig() {
  const ctx = useContext(UserConfigContext);
  if (!ctx) throw new Error('useUserConfig must be used inside UserConfigProvider');
  return ctx;
}
