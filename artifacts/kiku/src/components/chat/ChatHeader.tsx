import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, Brain, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUserConfig, AIEngine } from '@/contexts/UserConfigContext';

interface ChatHeaderProps {
  isTyping: boolean;
  onOpenSettings: () => void;
}

const ENGINE_LABELS: Record<AIEngine, { label: string; short: string; icon: typeof Zap }> = {
  groq: { label: 'Groq Fast Core', short: 'Groq', icon: Zap },
  gemini: { label: 'Gemini Quantum Core', short: 'Gemini', icon: Brain },
};

export function ChatHeader({ isTyping, onOpenSettings }: ChatHeaderProps) {
  const { config, setConfig } = useUserConfig();
  const [engineOpen, setEngineOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentEngine = ENGINE_LABELS[config.engine];
  const EngineIcon = currentEngine.icon;
  const hasBanner = Boolean(config.bannerImageUrl);
  const hasAvatar = Boolean(config.avatarImageUrl);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEngineOpen(false);
      }
    }
    if (engineOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [engineOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 flex items-center justify-between overflow-hidden"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--glass-border)',
        ...(hasBanner
          ? { background: 'transparent' }
          : {
              background: 'var(--glass-header-bg)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            }),
      }}
    >
      {/* Banner image layers (absolute, behind content) */}
      {hasBanner && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: `url(${config.bannerImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              background: 'rgba(0,0,0,0.58)',
              backdropFilter: 'blur(1px)',
            }}
          />
        </>
      )}

      {/* ── Left: Avatar + Name ── */}
      <div className="flex items-center gap-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="relative flex-shrink-0">
          {hasAvatar ? (
            <img
              src={config.avatarImageUrl}
              alt={config.displayName}
              className="w-10 h-10 rounded-full object-cover"
              style={{
                border: '1.5px solid var(--neon-teal-dim)',
                boxShadow: '0 0 14px var(--neon-teal-dim)',
              }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${config.avatarColorFrom} 0%, ${config.avatarColorTo} 100%)`,
                border: '1.5px solid var(--neon-teal-dim)',
                boxShadow: '0 0 16px var(--neon-teal-dim)',
                color: 'var(--neon-teal)',
              }}
            >
              {config.avatarInitial || 'I'}
            </div>
          )}
          <span
            className="online-dot absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: 'var(--online-color)',
              borderColor: hasBanner ? 'transparent' : 'var(--bg-base)',
              boxShadow: '0 0 6px var(--online-color)',
            }}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {config.displayName}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--neon-teal)', opacity: 0.8 }}>✦</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={isTyping ? 'typing' : 'online'}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-medium"
              style={{ color: isTyping ? 'var(--neon-teal)' : 'var(--text-muted)' }}
            >
              {isTyping ? 'thinking...' : 'online'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right: Engine Switcher + Settings ── */}
      <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 1 }}>

        {/* Engine Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setEngineOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all duration-200"
            style={{
              background: engineOpen ? 'rgba(255,255,255,0.12)' : 'var(--neon-teal-dim)',
              border: '1px solid var(--neon-teal-dim)',
              color: 'var(--neon-teal)',
            }}
            aria-label="Switch AI engine"
          >
            <EngineIcon size={11} />
            <span className="text-[10px] font-semibold tracking-wide">{currentEngine.short}</span>
            <ChevronDown
              size={9}
              style={{
                transform: engineOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                opacity: 0.7,
              }}
            />
          </button>

          <AnimatePresence>
            {engineOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  minWidth: 200,
                  zIndex: 100,
                }}
              >
                {(Object.entries(ENGINE_LABELS) as [AIEngine, typeof currentEngine][]).map(
                  ([id, info]) => {
                    const Icon = info.icon;
                    const isActive = config.engine === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setConfig({ engine: id }); setEngineOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-all duration-150"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                          borderBottom: id === 'groq' ? '1px solid var(--glass-border)' : 'none',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isActive ? 'var(--neon-teal-dim)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          <Icon size={11} style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-muted)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] font-medium"
                            style={{ color: isActive ? 'var(--neon-teal)' : 'var(--text-primary)' }}
                          >
                            {info.label}
                          </p>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--neon-teal)' }} />
                        )}
                      </button>
                    );
                  }
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </motion.header>
  );
}
