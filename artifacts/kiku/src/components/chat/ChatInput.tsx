import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, CircleStop as StopCircle, ImagePlus, X } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { compressImage } from '@/lib/imageUtils';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  pendingImage: string | null;
  onImageSelect: (dataUrl: string | null) => void;
}

export function ChatInput({
  input,
  isLoading,
  onChange,
  onSubmit,
  onStop,
  pendingImage,
  onImageSelect,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.25) + 'px';
  }, []);

  useEffect(() => { resizeTextarea(); }, [input, resizeTextarea]);

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

  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        // Compress to max 1024px / 82% JPEG — enough for Gemini vision, gentle on data
        const compressed = await compressImage(file, 1024, 0.82);
        onImageSelect(compressed);
      } catch {
        // Fallback: read raw
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) onImageSelect(ev.target.result as string);
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    },
    [onImageSelect]
  );

  const canSend = (input.trim().length > 0 || !!pendingImage) && !isLoading;

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

      {/* Pending image preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end mb-2 px-1"
          >
            <div className="relative">
              <img
                src={pendingImage}
                alt="pending upload"
                className="rounded-xl object-cover"
                style={{
                  height: 72,
                  width: 72,
                  border: '1px solid var(--neon-teal-dim)',
                  boxShadow: '0 0 12px var(--neon-teal-glow)',
                }}
              />
              <button
                type="button"
                onClick={() => onImageSelect(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(15,15,25,0.95)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                aria-label="Remove image"
              >
                <X size={9} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="flex-1 glass-input rounded-2xl overflow-hidden flex items-end px-3.5 py-2.5 gap-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Ketika..."
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

          {/* Image picker button */}
          {!isLoading && (
            <motion.button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              whileTap={{ scale: 0.88 }}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 mb-0.5"
              style={{
                color: pendingImage ? 'var(--neon-teal)' : 'rgba(255,255,255,0.25)',
                background: pendingImage ? 'var(--neon-teal-dim)' : 'transparent',
                boxShadow: pendingImage ? '0 0 8px var(--neon-teal-glow)' : 'none',
              }}
              aria-label="Attach image"
            >
              <ImagePlus size={14} />
            </motion.button>
          )}

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

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />

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
