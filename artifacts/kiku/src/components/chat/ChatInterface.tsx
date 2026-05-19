import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useIshitaChat } from '@/hooks/use-kiku-chat';
import { useUserConfig } from '@/contexts/UserConfigContext';
import { useMemory } from '@/contexts/MemoryContext';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';

export function ChatInterface() {
  const { config, setConfig } = useUserConfig();
  const { facts, addOrUpdateFact } = useMemory();

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useIshitaChat(
      config.engine,
      facts,
      addOrUpdateFact,
      () => setConfig({ engine: 'gemini' })
    );

  const bottomRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const lastMsg = messages[messages.length - 1];
  const showTypingIndicator =
    isLoading && (lastMsg?.role !== 'assistant' || lastMsg?.content === '');

  // The last assistant message is the one currently streaming
  const streamingMsgId =
    isLoading && lastMsg?.role === 'assistant' ? lastMsg.id : null;

  return (
    <div
      className="chat-height flex flex-col relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% 10%, var(--neon-teal-dim) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 80% 85%, var(--neon-blue-dim) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0) 0%, var(--bg-base) 100%)
          `,
        }}
      />

      <ChatHeader isTyping={isLoading} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Messages scroll area */}
      <div
        className="flex-1 overflow-y-auto scroll-custom relative z-10"
        style={{ paddingTop: '80px', paddingBottom: '120px' }}
      >
        <div className="flex flex-col gap-4 py-4 max-w-2xl mx-auto w-full">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === 'assistant' && msg.content === '' && !msg.thinkingSteps?.length)
                return null;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.id === streamingMsgId}
                />
              );
            })}
            {showTypingIndicator && <TypingIndicator key="typing-indicator" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        input={input}
        isLoading={isLoading}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={stop}
      />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
