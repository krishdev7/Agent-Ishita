import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, CircleStop as StopCircle } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({ input, isLoading, onChange, onSubmit, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.25) + 'px';
  }, []);

  useEffect(() => { resizeTextarea(); }, [input, resizeTextarea]);

  // Voice input — appends transcript to the current input
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      const newValue = input.trim() ? `${input.trim()} ${text}` : text;
      onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>);
    },
    [input, onChange]
  );

  const { isListening, isSupported, toggle: toggleVoice } = useVoiceInput(handleVoiceTranscript);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) onSubmit();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, var(--bg-base) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)`,
      }}
    >
      <div className="flex justify-center mb-2">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Shift+Enter for new line · /clear · /quantum
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="flex-1 glass-input rounded-2xl overflow-hidden flex items-end px-3.5 py-2.5 gap-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Ishita..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[14.5px] leading-relaxed placeholder:opacity-30"
            style={{
              color: 'rgba(255,255,255,0.9)',
              maxHeight: '25vh',
              minHeight: '24px',
              fontFamily: 'inherit',
              caretColor: 'var(--neon-teal)',
            }}
            disabled={isLoading}
          />

          {/* Mic button — only when input is empty and not loading */}
          {!input.trim() && !isLoading && isSupported && (
            <motion.button
              type="button"
              onClick={toggleVoice}
              whileTap={{ scale: 0.88 }}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 mb-0.5"
              style={{
                color: isListening ? 'var(--neon-teal)' : 'rgba(255,255,255,0.3)',
                background: isListening ? 'var(--neon-teal-dim)' : 'transparent',
                boxShadow: isListening ? '0 0 10px var(--neon-teal-glow)' : 'none',
              }}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                >
                  <MicOff size={14} />
                </motion.div>
              ) : (
                <Mic size={15} />
              )}
            </motion.button>
          )}
        </div>

        <motion.button
          type={isLoading ? 'button' : 'submit'}
          onClick={isLoading ? onStop : undefined}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background:
              canSend || isLoading
                ? 'linear-gradient(135deg, var(--neon-teal) 0%, var(--neon-blue) 100%)'
                : 'rgba(255,255,255,0.06)',
            boxShadow: canSend || isLoading ? '0 0 20px var(--neon-teal-dim)' : 'none',
            color: canSend || isLoading ? '#070a10' : 'rgba(255,255,255,0.2)',
            border: canSend || isLoading ? 'none' : '1px solid rgba(255,255,255,0.07)',
          }}
          aria-label={isLoading ? 'Stop' : 'Send message'}
        >
          {isLoading ? <StopCircle size={17} /> : <Send size={16} />}
        </motion.button>
      </form>
    </motion.div>
  );
}
