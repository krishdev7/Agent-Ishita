import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Cpu, Upload, Link2, Image as ImageIcon } from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { useUserConfig, AIEngine } from '@/contexts/UserConfigContext';
import { compressImage } from '@/lib/imageUtils';
import { MemoryCore } from './MemoryCore';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemeName; label: string; sub: string; preview: [string, string, string] }[] = [
  { id: 'obsidian', label: 'Obsidian Terminal', sub: 'Monochrome · Slate', preview: ['#050507', '#111113', '#9090a8'] },
  { id: 'cyberpunk', label: 'Cyberpunk Tokyo', sub: 'Purple · Neon Blue', preview: ['#08000f', '#150030', '#00e5ff'] },
  { id: 'custom', label: 'Custom Accent', sub: 'Pick your color', preview: ['#070a10', '#121820', '#00d4aa'] },
];

const ENGINE_OPTIONS: { id: AIEngine; label: string; sub: string; icon: typeof Zap }[] = [
  { id: 'groq', label: 'Groq Fast Core', sub: 'llama-3.3-70b · ultra-low latency', icon: Zap },
  { id: 'gemini', label: 'Gemini Quantum Core', sub: 'gemini-2.5-flash · deep reasoning', icon: Brain },
];

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex-shrink-0 cursor-pointer" style={{ width: 28, height: 28 }}>
      <span className="block w-full h-full rounded-full border-2 transition-all" style={{ background: value, borderColor: 'rgba(255,255,255,0.18)' }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
    </label>
  );
}

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  isCircle?: boolean;
  maxWidth: number;
  maxHeight: number;
  previewHeight?: number;
}

function ImageUploader({ label, value, onChange, isCircle, maxWidth, maxHeight, previewHeight = 72 }: ImageUploaderProps) {
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressed = await compressImage(file, maxWidth, maxHeight, 0.82);
      onChange(compressed);
    } catch {}
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleUrlApply() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlMode(false);
    setUrlInput('');
  }

  const previewStyle: React.CSSProperties = isCircle
    ? { width: previewHeight, height: previewHeight, borderRadius: '50%', flexShrink: 0 }
    : { width: '100%', height: previewHeight, borderRadius: 10 };

  return (
    <div className="flex flex-col gap-2">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Preview */}
        <div style={{ position: 'relative', ...previewStyle }}>
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                style={{ ...previewStyle, objectFit: 'cover', border: '1.5px solid var(--glass-border)' }}
              />
              <button
                onClick={() => onChange('')}
                style={{
                  position: 'absolute',
                  top: -7,
                  right: -7,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(10,10,15,0.92)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.75)',
                  zIndex: 2,
                }}
                aria-label="Remove"
              >
                <X size={9} />
              </button>
            </>
          ) : (
            <div
              style={{
                ...previewStyle,
                border: '1.5px dashed rgba(255,255,255,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <ImageIcon size={isCircle ? 18 : 20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              {!isCircle && (
                <span className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  no image
                </span>
              )}
            </div>
          )}
        </div>

        {/* Buttons (shown to the right of circle preview, or below wide preview) */}
        {isCircle && (
          <div className="flex flex-col gap-1.5" style={{ paddingTop: 4 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              <Upload size={10} />
              {loading ? 'compressing…' : 'Upload photo'}
            </button>
            <button
              onClick={() => setUrlMode((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all"
              style={{
                background: urlMode ? 'var(--neon-teal-dim)' : 'var(--bg-base)',
                border: urlMode ? '1px solid var(--neon-teal-dim)' : '1px solid var(--glass-border)',
                color: urlMode ? 'var(--neon-teal)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              <Link2 size={10} />
              Use URL
            </button>
          </div>
        )}
      </div>

      {/* Buttons below (for wide/banner/bg previews) */}
      {!isCircle && (
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Upload size={10} />
            {loading ? 'compressing…' : 'Upload image'}
          </button>
          <button
            onClick={() => setUrlMode((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all"
            style={{
              background: urlMode ? 'var(--neon-teal-dim)' : 'var(--bg-base)',
              border: urlMode ? '1px solid var(--neon-teal-dim)' : '1px solid var(--glass-border)',
              color: urlMode ? 'var(--neon-teal)' : 'var(--text-secondary)',
            }}
          >
            <Link2 size={10} />
            Use URL
          </button>
        </div>
      )}

      {/* URL input */}
      {urlMode && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
            placeholder="https://..."
            className="flex-1 px-3 py-1.5 rounded-lg text-[11px] outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
          <button
            onClick={handleUrlApply}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ background: 'var(--neon-teal-dim)', border: '1px solid var(--neon-teal-dim)', color: 'var(--neon-teal)' }}
          >
            Apply
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
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
              style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}
            >
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Customize your Ketika experience</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-7 px-5 py-5">

              {/* ── Visuals ── */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Visuals
                </p>
                <div className="flex flex-col gap-4 rounded-xl p-3.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                  {/* Avatar */}
                  <div>
                    <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-secondary)' }}>Avatar photo</p>
                    <ImageUploader
                      label="Avatar photo"
                      value={config.avatarImageUrl}
                      onChange={(url) => setConfig({ avatarImageUrl: url })}
                      isCircle
                      maxWidth={320}
                      maxHeight={320}
                      previewHeight={68}
                    />
                  </div>

                  <div style={{ height: 1, background: 'var(--glass-border)' }} />

                  {/* Banner */}
                  <div>
                    <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-secondary)' }}>Profile banner</p>
                    <ImageUploader
                      label="Profile banner"
                      value={config.bannerImageUrl}
                      onChange={(url) => setConfig({ bannerImageUrl: url })}
                      maxWidth={1200}
                      maxHeight={400}
                      previewHeight={72}
                    />
                  </div>

                  <div style={{ height: 1, background: 'var(--glass-border)' }} />

                  {/* Chat Background */}
                  <div>
                    <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-secondary)' }}>Chat background</p>
                    <ImageUploader
                      label="Chat background"
                      value={config.bgImageUrl}
                      onChange={(url) => setConfig({ bgImageUrl: url })}
                      maxWidth={1920}
                      maxHeight={1080}
                      previewHeight={90}
                    />
                  </div>
                </div>
              </section>

              {/* ── Divider ── */}
              <div style={{ height: 1, background: 'var(--glass-border)' }} />

              {/* ── Profile ── */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Profile
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden"
                    style={{
                      background: config.avatarImageUrl
                        ? 'transparent'
                        : `linear-gradient(135deg, ${config.avatarColorFrom} 0%, ${config.avatarColorTo} 100%)`,
                      border: '1.5px solid var(--neon-teal-dim)',
                      boxShadow: '0 0 20px var(--neon-teal-dim)',
                      color: 'var(--neon-teal)',
                    }}
                  >
                    {config.avatarImageUrl ? (
                      <img src={config.avatarImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      config.avatarInitial || 'K'
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>Avatar letter</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={config.avatarInitial}
                      onChange={(e) => setConfig({ avatarInitial: e.target.value.toUpperCase() || 'K' })}
                      className="w-20 px-3 py-1.5 rounded-lg text-sm font-semibold text-center outline-none transition-all"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      placeholder="K"
                      disabled={Boolean(config.avatarImageUrl)}
                    />
                  </div>
                </div>

                <div className="rounded-xl p-3.5 flex flex-col gap-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Avatar gradient</span>
                    <div className="flex items-center gap-2">
                      <ColorSwatch value={rgbaToHex(config.avatarColorFrom)} onChange={(hex) => setConfig({ avatarColorFrom: hexWithOpacity(hex, 0.3) })} />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→</span>
                      <ColorSwatch value={rgbaToHex(config.avatarColorTo)} onChange={(hex) => setConfig({ avatarColorTo: hexWithOpacity(hex, 0.3) })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Banner color</span>
                    <ColorSwatch value={config.bannerColor} onChange={(hex) => setConfig({ bannerColor: hex })} />
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
                        <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="w-full h-1/2" style={{ background: t.preview[0] }} />
                          <div className="flex h-1/2">
                            <div className="flex-1" style={{ background: t.preview[1] }} />
                            <div className="w-2" style={{ background: t.preview[2] }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-primary)' }}>{t.label}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{t.sub}</p>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--neon-teal)', boxShadow: '0 0 6px var(--neon-teal)' }} />}
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
                          style={{ background: isActive ? 'var(--neon-teal-dim)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
                        >
                          <Icon size={14} style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-muted)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-primary)' }}>{eng.label}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{eng.sub}</p>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--neon-teal)', boxShadow: '0 0 6px var(--neon-teal)' }} />}
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
