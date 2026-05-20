import { useState, useCallback, useRef } from "react";
import type { AIEngine } from "@/contexts/UserConfigContext";
import type { UserFact } from "@/contexts/MemoryContext";
import { cacheSelfieUrl } from "@/lib/imageCache";

export type MessageRole = "user" | "assistant";

export interface ThinkingStep {
  type: "tool-call" | "tool-result";
  toolName: string;
  detail?: string;
  ts: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  thinkingSteps?: ThinkingStep[];
}

// ─── History persistence ───────────────────────────────────────────────────
const HISTORY_KEY = "ketika_chat_history_v1";
type StoredMessage = Omit<Message, "createdAt"> & { createdAt: string };

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredMessage[];
    return stored
      .filter((m) => m.content.length > 0 || m.imageUrl)
      .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    // Don't persist large base64 image data in history
    const sanitized = messages.map((m) => ({
      ...m,
      imageUrl: m.imageUrl?.startsWith("data:") ? undefined : m.imageUrl,
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sanitized));
  } catch {}
}

// ─── Stream marker extraction ──────────────────────────────────────────────
interface MarkerResult {
  display: string;
  thinkEvents: ThinkingStep[];
  leftover: string;
}

function extractMarkers(text: string): MarkerResult {
  const thinkEvents: ThinkingStep[] = [];
  let display = "";
  let i = 0;

  while (i < text.length) {
    const start = text.indexOf("\x02", i);
    if (start === -1) {
      display += text.slice(i);
      return { display, thinkEvents, leftover: "" };
    }
    display += text.slice(i, start);
    const end = text.indexOf("\x02", start + 1);
    if (end === -1) return { display, thinkEvents, leftover: text.slice(start) };
    const content = text.slice(start + 1, end);
    if (content.startsWith("THINK:")) {
      try {
        const ev = JSON.parse(content.slice(6));
        thinkEvents.push({
          type: ev.t === "call" ? "tool-call" : "tool-result",
          toolName: ev.n as string,
          detail: ev.q as string | undefined,
          ts: Date.now(),
        });
      } catch {}
    }
    i = end + 1;
  }
  return { display, thinkEvents, leftover: "" };
}

const FACTS_RE = /<\|facts\|>([\s\S]*?)<\|\/facts\|>/;
const SELFIE_RE = /!\[selfie\]\((https?:\/\/[^)]+)\)/g;

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "aye, finally. kahan tha itni der?\n\nbata kya scene hai — koi problem, koi idea, ya bas mujhse baat karni thi? dono theek hai, but be specific. \"kuch nahi\" mat bolna.\n\n*`/clear` — fresh start | `/quantum` — gemini deep mode for heavy stuff*",
  createdAt: new Date(),
};

let idCounter = 0;
function genId() {
  return `msg_${Date.now()}_${++idCounter}`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useIshitaChat(
  engine: AIEngine = "groq",
  facts: UserFact[] = [],
  onFactLearned?: (key: string, value: string) => void,
  onSwitchToGemini?: () => void
) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const history = loadHistory();
    return history.length > 0 ? history : [WELCOME_MSG];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const historyRef = useRef(messages);
  historyRef.current = messages;

  const persistHistory = useCallback((msgs: Message[]) => {
    saveHistory(msgs);
  }, []);

  const clearHistory = useCallback(() => {
    const cleared: Message[] = [
      {
        id: genId(),
        role: "assistant",
        content: "theek hai, sab gone. fresh start. ab bata kya hai?",
        createdAt: new Date(),
      },
    ];
    setMessages(cleared);
    persistHistory(cleared);
  }, [persistHistory]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
    []
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      const imageToSend = pendingImage;

      if ((!trimmed && !imageToSend) || isLoading) return;

      // ── Slash commands (text only) ───────────────────────────────────────
      if (trimmed === "/clear") {
        clearHistory();
        setInput("");
        return;
      }
      if (trimmed === "/quantum") {
        onSwitchToGemini?.();
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              id: genId(),
              role: "assistant" as MessageRole,
              content: "switched to gemini deep core. ab koi bhi heavy cheez leke aa — math, systems, proofs, sab handle hoga.",
              createdAt: new Date(),
            },
          ];
          persistHistory(next);
          return next;
        });
        setInput("");
        return;
      }

      // ── Normal send ──────────────────────────────────────────────────────
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: trimmed,
        imageUrl: imageToSend ?? undefined,
        createdAt: new Date(),
      };
      const assistantId = genId();

      setPendingImage(null);
      setInput("");
      setIsLoading(true);

      setMessages((prev) => {
        const next = [
          ...prev,
          userMsg,
          { id: assistantId, role: "assistant" as MessageRole, content: "", createdAt: new Date() },
        ];
        persistHistory(next);
        return next;
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Build API messages — support multimodal when imageUrl is present
        const apiMessages = [...historyRef.current, userMsg].map((m) => {
          if (m.imageUrl) {
            const parts: Array<{ type: "image"; image: string } | { type: "text"; text: string }> =
              [{ type: "image", image: m.imageUrl }];
            if (m.content) parts.push({ type: "text", text: m.content });
            return { role: m.role as "user" | "assistant", content: parts };
          }
          return { role: m.role as "user" | "assistant", content: m.content };
        });

        const userMemory: Record<string, string> = {};
        facts.forEach((f) => { userMemory[f.key] = f.value; });

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, engine, userMemory }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(`API error: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let markerBuffer = "";
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const { display, thinkEvents, leftover } = extractMarkers(markerBuffer + chunk);
          markerBuffer = leftover;
          accumulatedContent += display;

          if (thinkEvents.length > 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, thinkingSteps: [...(m.thinkingSteps ?? []), ...thinkEvents] }
                  : m
              )
            );
          }
          if (display) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + display } : m
              )
            );
          }
        }

        // Flush leftover buffer
        if (markerBuffer) {
          accumulatedContent += markerBuffer;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + markerBuffer } : m
            )
          );
        }

        // Cache any selfie URLs discovered in the stream
        let selfieMatch: RegExpExecArray | null;
        const selfieRe = new RegExp(SELFIE_RE.source, "g");
        while ((selfieMatch = selfieRe.exec(accumulatedContent)) !== null) {
          cacheSelfieUrl(selfieMatch[1]);
        }

        // Post-process: strip facts block, fire onFactLearned
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            const match = FACTS_RE.exec(m.content);
            if (!match) return m;
            try {
              const learned = JSON.parse(match[1]) as Array<{ key: string; value: string }>;
              learned.forEach((f) => onFactLearned?.(f.key, f.value));
            } catch {}
            return { ...m, content: m.content.replace(FACTS_RE, "").trimEnd() };
          })
        );

        // Persist final state
        setMessages((prev) => { persistHistory(prev); return prev; });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "ugh jaan, kuch toh gadbad ho gayi — try again?" }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, pendingImage, isLoading, engine, facts, onFactLearned, onSwitchToGemini, clearHistory, persistHistory]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const reload = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") return prev.slice(0, -1);
      return prev;
    });
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setInput,
    clearHistory,
    pendingImage,
    setPendingImage,
  };
}
