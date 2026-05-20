import { useState, useRef } from 'react';
import { Brain, Trash2, Plus, Download, Upload, X, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory, UserFact } from '@/contexts/MemoryContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserConfig } from '@/contexts/UserConfigContext';

interface EditState {
  id: string;
  key: string;
  value: string;
}

export function MemoryCore() {
  const { facts, addOrUpdateFact, deleteFact, updateFactValue, clearAllFacts, importFacts } = useMemory();
  const { theme } = useTheme();
  const { config, setConfig } = useUserConfig();
  const { setThemeName, setCustomAccent } = useTheme();

  const [editState, setEditState] = useState<EditState | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSaveEdit() {
    if (!editState) return;
    updateFactValue(editState.id, editState.key, editState.value);
    setEditState(null);
  }

  function handleAddFact() {
    if (!newKey.trim() || !newValue.trim()) return;
    addOrUpdateFact(newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setShowAddRow(false);
  }

  function handleExport() {
    const profile = {
      version: 2,
      exportedAt: new Date().toISOString(),
      memory: facts,
      theme: { name: theme.name, customAccent: theme.customAccent },
      userConfig: config,
    };
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ketika_profile.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const profile = JSON.parse(ev.target?.result as string);
        if (profile.memory && Array.isArray(profile.memory)) {
          importFacts(profile.memory as UserFact[]);
        }
        if (profile.theme?.name) {
          setThemeName(profile.theme.name);
          if (profile.theme.customAccent) setCustomAccent(profile.theme.customAccent);
        }
        if (profile.userConfig) {
          setConfig(profile.userConfig);
        }
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch {
        setImportError('Invalid profile file — make sure it\'s a ketika_profile.json');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Brain size={12} style={{ color: 'var(--neon-teal)' }} />
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Ketika Memory Core
        </p>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          style={{
            background: 'var(--neon-teal-dim)',
            color: 'var(--neon-teal)',
            border: '1px solid var(--neon-teal-dim)',
          }}
        >
          {facts.length} {facts.length === 1 ? 'fact' : 'facts'}
        </span>
      </div>

      {/* ── Memory Slate ── */}
      <div
        className="rounded-xl overflow-hidden mb-2"
        style={{ border: '1px solid var(--glass-border)' }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--glass-border)' }}
        >
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Memory Slate
          </span>
          {facts.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md transition-all"
              style={{ color: 'rgba(255,80,80,0.6)', border: '1px solid rgba(255,80,80,0.15)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,80,80,0.08)';
                e.currentTarget.style.color = 'rgba(255,80,80,0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,80,80,0.6)';
              }}
            >
              <Trash2 size={9} />
              Clear all
            </button>
          )}
        </div>

        {/* Clear confirm */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 py-2.5 flex items-center justify-between"
              style={{ background: 'rgba(255,80,80,0.06)', borderBottom: '1px solid var(--glass-border)' }}
            >
              <span className="text-[11px]" style={{ color: 'rgba(255,120,120,0.9)' }}>
                Delete all {facts.length} facts permanently?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-[10px] px-2 py-0.5 rounded-md"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { clearAllFacts(); setShowClearConfirm(false); }}
                  className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                  style={{ background: 'rgba(255,80,80,0.2)', color: 'rgba(255,120,120,0.95)', border: '1px solid rgba(255,80,80,0.3)' }}
                >
                  Delete all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Facts list */}
        <div style={{ background: 'var(--bg-surface)', maxHeight: 280, overflowY: 'auto' }} className="scroll-custom">
          <AnimatePresence initial={false}>
            {facts.length === 0 && !showAddRow ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  No memories yet — start chatting and she'll learn about you.
                </p>
              </div>
            ) : (
              facts.map((fact) => (
                <motion.div
                  key={fact.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                >
                  {editState?.id === fact.id ? (
                    <div className="px-3 py-2.5 flex gap-2 items-start">
                      <input
                        autoFocus
                        value={editState.key}
                        onChange={(e) => setEditState({ ...editState, key: e.target.value })}
                        className="w-24 text-[11px] px-2 py-1 rounded-md outline-none flex-shrink-0"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--neon-teal-dim)', color: 'var(--neon-teal)' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditState(null);
                        }}
                      />
                      <input
                        value={editState.value}
                        onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                        className="flex-1 text-[11px] px-2 py-1 rounded-md outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditState(null);
                        }}
                      />
                      <button onClick={handleSaveEdit} className="p-1" style={{ color: 'var(--neon-teal)' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditState(null)} className="p-1" style={{ color: 'var(--text-muted)' }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="px-3 py-2.5 flex items-center gap-2 cursor-pointer group"
                      onClick={() => setEditState({ id: fact.id, key: fact.key, value: fact.value })}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span className="text-[10px] font-semibold flex-shrink-0 w-24 truncate" style={{ color: 'var(--neon-teal)' }}>
                        {fact.key}
                      </span>
                      <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {fact.value}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFact(fact.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all flex-shrink-0"
                        style={{ color: 'rgba(255,80,80,0.7)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,80,80,1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,80,80,0.7)'; }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Add new fact row */}
          <AnimatePresence>
            {showAddRow && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2.5 flex gap-2 items-start"
                style={{ borderTop: facts.length > 0 ? '1px solid var(--glass-border)' : 'none' }}
              >
                <input
                  autoFocus
                  placeholder="key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-24 text-[11px] px-2 py-1 rounded-md outline-none flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--neon-teal-dim)', color: 'var(--neon-teal)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFact();
                    if (e.key === 'Escape') setShowAddRow(false);
                  }}
                />
                <input
                  placeholder="value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 text-[11px] px-2 py-1 rounded-md outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFact();
                    if (e.key === 'Escape') setShowAddRow(false);
                  }}
                />
                <button onClick={handleAddFact} className="p-1" style={{ color: 'var(--neon-teal)' }}>
                  <Check size={13} />
                </button>
                <button onClick={() => setShowAddRow(false)} className="p-1" style={{ color: 'var(--text-muted)' }}>
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add fact button */}
        <button
          onClick={() => setShowAddRow(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 transition-all"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'var(--neon-teal)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Plus size={12} />
          <span className="text-[11px] font-medium">Add fact manually</span>
        </button>
      </div>

      {/* ── Export / Import ── */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200"
          style={{ background: 'var(--neon-teal-dim)', border: '1px solid var(--neon-teal-dim)', color: 'var(--neon-teal)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--neon-teal-dim)'; }}
        >
          <Download size={12} />
          Export Profile
        </button>

        <label
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all duration-200"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Upload size={12} />
          Import Profile
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'var(--neon-teal-dim)', border: '1px solid var(--neon-teal-dim)' }}
          >
            <Check size={11} style={{ color: 'var(--neon-teal)', flexShrink: 0 }} />
            <span className="text-[11px]" style={{ color: 'var(--neon-teal)' }}>
              Profile imported successfully!
            </span>
          </motion.div>
        )}
        {importError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}
          >
            <AlertTriangle size={11} style={{ color: 'rgba(255,120,120,0.9)', flexShrink: 0 }} />
            <span className="text-[11px]" style={{ color: 'rgba(255,120,120,0.9)' }}>
              {importError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
