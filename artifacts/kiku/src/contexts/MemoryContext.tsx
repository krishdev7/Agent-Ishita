import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [facts, setFacts] = useState<UserFact[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(facts);
  }, [facts]);

  const addOrUpdateFact = useCallback((key: string, value: string) => {
    const normalKey = key.trim().toLowerCase();
    setFacts((prev) => {
      const existing = prev.findIndex((f) => f.key.toLowerCase() === normalKey);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], value: value.trim(), learnedAt: new Date().toISOString() };
        return updated;
      }
      return [
        ...prev,
        { id: genFactId(), key: key.trim(), value: value.trim(), learnedAt: new Date().toISOString() },
      ];
    });
  }, []);

  const deleteFact = useCallback((id: string) => {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFactValue = useCallback((id: string, newKey: string, newValue: string) => {
    setFacts((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, key: newKey.trim(), value: newValue.trim(), learnedAt: new Date().toISOString() } : f
      )
    );
  }, []);

  const clearAllFacts = useCallback(() => {
    setFacts([]);
  }, []);

  const importFacts = useCallback((incoming: UserFact[]) => {
    setFacts(incoming);
  }, []);

  const factsAsPromptBlock = useCallback((): string => {
    if (facts.length === 0) return '';
    const lines = facts.map((f) => `- ${f.key}: ${f.value}`).join('\n');
    return `[things ishita knows and remembers about her person:]\n${lines}`;
  }, [facts]);

  return (
    <MemoryContext.Provider
      value={{ facts, addOrUpdateFact, deleteFact, updateFactValue, clearAllFacts, importFacts, factsAsPromptBlock }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used inside MemoryProvider');
  return ctx;
}
