import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Cpu } from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { useUserConfig, AIEngine } from '@/contexts/UserConfigContext';
import { MemoryCore } from './MemoryCore';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemeName; label: string; sub: string; preview: [string, string, string] }[] = [
  {
    id: 'obsidian',
    label: 'Obsidian Terminal',
    sub: 'Monochrome · Slate',
    preview: ['#050507', '#111113', '#9090a8'],
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Tokyo',
    sub: 'Purple · Neon Blue',
    preview: ['#08000f', '#150030', '#00e5ff'],
  },
  {
    id: 'custom',
    label: 'Custom Accent',
    sub: 'Pick your color',
    preview: ['#070a10', '#121820', '#00d4aa'],
  },
];

const ENGINE_OPTIONS: { id: AIEngine; label: string; sub: string; icon: typeof Zap }[] = [
  { id: 'groq', label: 'Groq Fast Core', sub: 'llama-3.3-70b · ultra-low latency', icon: Zap },
  { id: 'gemini', label: 'Gemini Quantum Core', sub: 'gemini-2.0-flash · deep reasoning', icon: Brain },
];

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex-shrink-0 cursor-pointer" style={{ width: 28, height: 28 }}>
      <span
        className="block w-full h-full rounded-full border-2 transition-all"
        style={{ background: value, borderColor: 'rgba(255,255,255,0.18)' }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </label>
  );
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { theme, setThemeName, setCustomAccent } = useTheme();
  const { config, setConfig } = useUserConfig();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[70] flex flex-col overflow-y-auto scroll-custom"
            style={{
              width: 'min(380px, 100vw)',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--glass-border)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0 sticky top-0 z-10"
              style={{
                borderBottom: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
              }}
            >
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Settings
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Customize your Ishita experience
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-7 px-5 py-5">

              {/* ── Profile ── */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Profile
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${config.avatarColorFrom} 0%, ${config.avatarColorTo} 100%)`,
                      border: '1.5px solid var(--neon-teal-dim)',
                      boxShadow: '0 0 20px var(--neon-teal-dim)',
                      color: 'var(--neon-teal)',
                    }}
                  >
                    {config.avatarInitial || 'I'}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Avatar letter
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={config.avatarInitial}
                      onChange={(e) => setConfig({ avatarInitial: e.target.value.toUpperCase() || 'I' })}
                      className="w-20 px-3 py-1.5 rounded-lg text-sm font-semibold text-center outline-none transition-all"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-xl p-3.5 flex flex-col gap-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Avatar gradient</span>
                    <div className="flex items-center gap-2">
                      <ColorSwatch
                        value={rgbaToHex(config.avatarColorFrom)}
                        onChange={(hex) => setConfig({ avatarColorFrom: hexWithOpacity(hex, 0.3) })}
                      />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→</span>
                      <ColorSwatch
                        value={rgbaToHex(config.avatarColorTo)}
                        onChange={(hex) => setConfig({ avatarColorTo: hexWithOpacity(hex, 0.3) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Banner color</span>
                    <ColorSwatch
                      value={config.bannerColor}
                      onChange={(hex) => setConfig({ bannerColor: hex })}
                    />
                  </div>
                </div>
              </section>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: 'var(--glass-border)' }} />

              {/* ── Theme Engine ── */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Theme Engine
                </p>

                <div className="flex flex-col gap-2">
                  {THEME_OPTIONS.map((t) => {
                    const isActive = theme.name === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setThemeName(t.id)}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.05)' : 'var(--bg-elevated)',
                          border: isActive ? '1px solid var(--neon-teal-dim)' : '1px solid var(--glass-border)',
                          boxShadow: isActive ? '0 0 0 1px var(--neon-teal-dim)' : 'none',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="w-full h-1/2" style={{ background: t.preview[0] }} />
                          <div className="flex h-1/2">
                            <div className="flex-1" style={{ background: t.preview[1] }} />
                            <div className="w-2" style={{ background: t.preview[2] }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-primary)' }}>
                            {t.label}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{t.sub}</p>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--neon-teal)', boxShadow: '0 0 6px var(--neon-teal)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {theme.name === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 rounded-xl px-3.5 py-3 flex items-center justify-between"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}
                  >
                    <div>
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>Accent color</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sets glow, bubbles & indicators</p>
                    </div>
                    <ColorSwatch value={theme.customAccent} onChange={setCustomAccent} />
                  </motion.div>
                )}
              </section>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: 'var(--glass-border)' }} />

              {/* ── AI Core ── */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  AI Core
                </p>

                <div className="flex flex-col gap-2">
                  {ENGINE_OPTIONS.map((eng) => {
                    const isActive = config.engine === eng.id;
                    const Icon = eng.icon;
                    return (
                      <button
                        key={eng.id}
                        onClick={() => setConfig({ engine: eng.id })}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.05)' : 'var(--bg-elevated)',
                          border: isActive ? '1px solid var(--neon-teal-dim)' : '1px solid var(--glass-border)',
                          boxShadow: isActive ? '0 0 0 1px var(--neon-teal-dim)' : 'none',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isActive ? 'var(--neon-teal-dim)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          <Icon size={14} style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-muted)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-primary)' }}>
                            {eng.label}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{eng.sub}</p>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--neon-teal)', boxShadow: '0 0 6px var(--neon-teal)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mt-2 rounded-xl px-3.5 py-3 flex items-start gap-2.5"
                  style={{ background: 'var(--neon-teal-dim)', border: '1px solid var(--neon-teal-dim)' }}
                >
                  <Cpu size={13} style={{ color: 'var(--neon-teal)', marginTop: 1, flexShrink: 0 }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    The selected AI core is sent with every message. Groq is fastest; Gemini excels at deep analysis.
                  </p>
                </div>
              </section>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: 'var(--glass-border)' }} />

              {/* ── Memory Core ── */}
              <MemoryCore />

              {/* Bottom padding */}
              <div style={{ height: 16 }} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function rgbaToHex(rgba: string): string {
  const match = rgba.match(/[\d.]+/g);
  if (!match || match.length < 3) return '#888888';
  const r = Math.round(parseFloat(match[0]));
  const g = Math.round(parseFloat(match[1]));
  const b = Math.round(parseFloat(match[2]));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function hexWithOpacity(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
