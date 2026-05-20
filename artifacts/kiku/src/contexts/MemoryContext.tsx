import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getOrCreateProfileKey } from '@/lib/profileKey';

const STORAGE_KEY = 'ishita_memory_v1';

export interface UserFact {
  id: string;
  key: string;
  value: string;
  learnedAt: string;
}

interface MemoryContextValue {
  facts: UserFact[];
  addOrUpdateFact: (key: string, value: string) => void;
  deleteFact: (id: string) => void;
  updateFactValue: (id: string, newKey: string, newValue: string) => void;
  clearAllFacts: () => void;
  importFacts: (incoming: UserFact[]) => void;
  factsAsPromptBlock: () => string;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

function loadFromStorage(): UserFact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserFact[];
  } catch {
    return [];
  }
}

function saveToStorage(facts: UserFact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facts));
  } catch {}
}

let counter = 0;
function genFactId() {
  return `fact_${Date.now()}_${++counter}`;
}

function syncFactToCloud(profileKey: string, key: string, value: string) {
  fetch(`/api/memory/${profileKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(() => {});
}

function deleteFactFromCloud(profileKey: string, factKey: string) {
  fetch(`/api/memory/${profileKey}/${encodeURIComponent(factKey)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [facts, setFacts] = useState<UserFact[]>(loadFromStorage);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  useEffect(() => {
    const profileKey = getOrCreateProfileKey();
    fetch(`/api/memory/${profileKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rows: Array<{ factKey: string; value: string; learnedAt: string }> | null) => {
        if (rows && rows.length > 0) {
          setFacts(
            rows.map((r) => ({
              id: `fact_cloud_${r.factKey}`,
              key: r.factKey,
              value: r.value,
              learnedAt: typeof r.learnedAt === 'string' ? r.learnedAt : new Date().toISOString(),
            }))
          );
        }
        setCloudLoaded(true);
      })
      .catch(() => setCloudLoaded(true));
  }, []);

  useEffect(() => {
    if (cloudLoaded) saveToStorage(facts);
  }, [facts, cloudLoaded]);

  const addOrUpdateFact = useCallback((key: string, value: string) => {
    const normalKey = key.trim().toLowerCase();
    const profileKey = getOrCreateProfileKey();
    setFacts((prev) => {
      const existing = prev.findIndex((f) => f.key.toLowerCase() === normalKey);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], value: value.trim(), learnedAt: new Date().toISOString() };
        return updated;
      }
      return [...prev, { id: genFactId(), key: key.trim(), value: value.trim(), learnedAt: new Date().toISOString() }];
    });
    syncFactToCloud(profileKey, key.trim(), value.trim());
  }, []);

  const deleteFact = useCallback((id: string) => {
    const profileKey = getOrCreateProfileKey();
    setFacts((prev) => {
      const fact = prev.find((f) => f.id === id);
      if (fact) deleteFactFromCloud(profileKey, fact.key);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateFactValue = useCallback((id: string, newKey: string, newValue: string) => {
    const profileKey = getOrCreateProfileKey();
    setFacts((prev) => {
      const old = prev.find((f) => f.id === id);
      if (old && old.key !== newKey.trim()) deleteFactFromCloud(profileKey, old.key);
      return prev.map((f) =>
        f.id === id
          ? { ...f, key: newKey.trim(), value: newValue.trim(), learnedAt: new Date().toISOString() }
          : f
      );
    });
    syncFactToCloud(profileKey, newKey.trim(), newValue.trim());
  }, []);

  const clearAllFacts = useCallback(() => {
    const profileKey = getOrCreateProfileKey();
    setFacts([]);
    fetch(`/api/memory/${profileKey}/all`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const importFacts = useCallback((incoming: UserFact[]) => {
    setFacts(incoming);
  }, []);

  const factsAsPromptBlock = useCallback((): string => {
    if (facts.length === 0) return '';
    const lines = facts.map((f) => `- ${f.key}: ${f.value}`).join('\n');
    return `[things ketika knows and remembers about her person:]\n${lines}`;
  }, [facts]);

  return (
    <MemoryContext.Provider value={{ facts, addOrUpdateFact, deleteFact, updateFactValue, clearAllFacts, importFacts, factsAsPromptBlock }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used inside MemoryProvider');
  return ctx;
}
