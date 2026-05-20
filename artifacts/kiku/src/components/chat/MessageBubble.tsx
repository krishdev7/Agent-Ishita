import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/hooks/use-kiku-chat';
import { ThinkingAccordion } from './ThinkingAccordion';
import { useUserConfig } from '@/contexts/UserConfigContext';
import { getOrCreateProxyUrl } from '@/lib/imageCache';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 transition-all duration-150"
      style={{ color: copied ? 'var(--neon-teal)' : 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      <span style={{ fontSize: 10, fontFamily: 'monospace' }}>{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}

/**
 * CachedImage — renders any external image through wsrv.nl compression proxy.
 * Shrinks 8K UHD photos to ~720px JPEG before they hit the network.
 * Caches the original→proxy URL mapping in localStorage.
 * Falls back to the original URL if the proxy fails.
 */
function CachedImage({ src, alt }: { src: string; alt: string }) {
  const proxySrc = getOrCreateProxyUrl(src, 720, 76);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const displaySrc = useFallback ? src : proxySrc;

  if (errored) return null;

  return (
    <div className="my-3">
      {!loaded && (
        <div
          className="animate-pulse rounded-2xl"
          style={{ height: 200, background: 'rgba(255,255,255,0.04)' }}
        />
      )}
      <img
        src={displaySrc}
        alt={alt || 'photo'}
        loading="lazy"
        decoding="async"
        className="rounded-2xl max-w-full"
        style={{
          display: loaded ? 'block' : 'none',
          maxHeight: 340,
          width: 'auto',
          objectFit: 'cover',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 6px 32px rgba(0,0,0,0.5)',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!useFallback && displaySrc !== src) {
            setUseFallback(true);
          } else {
            setErrored(true);
          }
        }}
      />
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeStr = String(children).replace(/\n$/, '');

          if (match) {
            return (
              <div
                className="my-2 rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="flex items-center justify-between px-3 py-1.5"
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {match[1]}
                  </span>
                  <CopyButton code={codeStr} />
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, background: 'rgba(0,0,0,0.3)', fontSize: '12px', lineHeight: '1.6', padding: '12px 14px', borderRadius: 0 }}
                  codeTagProps={{ style: { fontFamily: '"Fira Code", "JetBrains Mono", monospace' } }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: '0.84em', fontFamily: '"Fira Code", monospace', color: 'var(--neon-teal)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {children}
            </code>
          );
        },
        img({ src, alt }) {
          if (!src) return null;
          return <CachedImage src={src} alt={alt || 'photo'} />;
        },
        p({ children }) {
          return <p style={{ margin: '0 0 8px 0', lineHeight: 1.65 }} className="last:mb-0">{children}</p>;
        },
        strong({ children }) {
          return <strong style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{children}</strong>;
        },
        em({ children }) {
          return <em style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{children}</em>;
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-teal)', textDecoration: 'underline', textDecorationColor: 'var(--neon-teal-dim)' }}>
              {children}
            </a>
          );
        },
        ul({ children }) {
          return <ul style={{ margin: '6px 0 8px 0', paddingLeft: 18, listStyleType: 'disc' }}>{children}</ul>;
        },
        ol({ children }) {
          return <ol style={{ margin: '6px 0 8px 0', paddingLeft: 18, listStyleType: 'decimal' }}>{children}</ol>;
        },
        li({ children }) {
          return <li style={{ marginBottom: 3, lineHeight: 1.6 }}>{children}</li>;
        },
        h1({ children }) {
          return <h1 style={{ fontSize: '1.2em', fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.95)' }}>{children}</h1>;
        },
        h2({ children }) {
          return <h2 style={{ fontSize: '1.05em', fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>{children}</h2>;
        },
        h3({ children }) {
          return <h3 style={{ fontSize: '0.95em', fontWeight: 600, marginBottom: 4, color: 'rgba(255,255,255,0.85)' }}>{children}</h3>;
        },
        blockquote({ children }) {
          return (
            <blockquote style={{ borderLeft: '2px solid var(--neon-teal-dim)', margin: '6px 0', paddingLeft: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
              {children}
            </blockquote>
          );
        },
        hr() {
          return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{children}</th>;
        },
        td({ children }) {
          return <td style={{ padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}>{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { config } = useUserConfig();
  const hasThinking = (message.thinkingSteps?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} px-4`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2.5 mt-1">
          {config.avatarImageUrl ? (
            <img
              src={config.avatarImageUrl}
              alt="Ketika"
              className="w-7 h-7 rounded-full object-cover"
              style={{ border: '1px solid var(--neon-teal-dim)' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: `linear-gradient(135deg, ${config.avatarColorFrom} 0%, ${config.avatarColorTo} 100%)`,
                border: '1px solid var(--neon-teal-dim)',
                color: 'var(--neon-teal)',
              }}
            >
              {config.avatarInitial || 'K'}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[70%]`}>
        {/* Thinking accordion — appears above the reply */}
        {!isUser && hasThinking && (
          <div className="w-full mb-1">
            <ThinkingAccordion steps={message.thinkingSteps ?? []} isStreaming={isStreaming} />
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${isUser ? 'rounded-tr-md user-bubble' : 'rounded-tl-md kiku-bubble'}`}
        >
          {!isUser && (
            <p
              className="text-[10px] font-semibold mb-1.5 tracking-widest uppercase"
              style={{ color: 'var(--neon-teal)', opacity: 0.7 }}
            >
              Ketika
            </p>
          )}

          {isUser ? (
            <div>
              {/* User-uploaded image */}
              {message.imageUrl && (
                <div className="mb-2">
                  <img
                    src={message.imageUrl}
                    alt="sent image"
                    className="rounded-xl max-w-full"
                    style={{
                      maxHeight: 240,
                      maxWidth: 240,
                      objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              )}
              {message.content && (
                <p
                  className="text-[14.5px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.01em' }}
                >
                  {message.content}
                </p>
              )}
            </div>
          ) : (
            <div
              className="text-[14px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.82)', letterSpacing: '0.01em' }}
            >
              <MarkdownContent content={message.content} />
            </div>
          )}
        </div>

        <span className="mt-1.5 text-[10px] px-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
