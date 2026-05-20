import { useState, useCallback, useRef, useEffect } from "react";
import type { AIEngine } from "@/contexts/UserConfigContext";
import type { UserFact } from "@/contexts/MemoryContext";

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
  createdAt: Date;
  thinkingSteps?: ThinkingStep[];
}

// ─── History persistence ───────────────────────────────────────────────────
const HISTORY_KEY = "ishita_chat_history_v1";
type StoredMessage = Omit<Message, "createdAt"> & { createdAt: string };

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredMessage[];
    return stored
      .filter((m) => m.content.length > 0)
      .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(messages.filter((m) => m.content.length > 0))
    );
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

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "aye, finally. kahan tha itni der?\n\nbata kya scene hai — koi problem, koi idea, ya bas mujhse baat karni thi? dono theek hai, but be specific. \"kuch nahi\" mat bolna, that's not an answer.\n\n*`/clear` — fresh start | `/quantum` — gemini deep mode for heavy stuff*",
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
    []
  );

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
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      // ── Slash commands ──────────────────────────────────────────────────
      if (trimmed === "/clear") {
        clearHistory();
        setInput("");
        return;
      }
      if (trimmed === "/quantum") {
        onSwitchToGemini?.();
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: "assistant",
            content:
              "switched to gemini deep core. ab koi bhi heavy cheez leke aa — math, systems, proofs, sab handle hoga.",
            createdAt: new Date(),
          },
        ]);
        setInput("");
        return;
      }

      // ── Normal send ─────────────────────────────────────────────────────
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };
      const assistantId = genId();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
      ]);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const { display, thinkEvents, leftover } = extractMarkers(
            markerBuffer + chunk
          );
          markerBuffer = leftover;

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
                m.id === assistantId
                  ? { ...m, content: m.content + display }
                  : m
              )
            );
          }
        }

        // Flush any leftover buffer
        if (markerBuffer) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + markerBuffer }
                : m
            )
          );
        }

        // Post-process: strip facts block, fire onFactLearned
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            const match = FACTS_RE.exec(m.content);
            if (!match) return m;
            try {
              const learned = JSON.parse(match[1]) as Array<{
                key: string;
                value: string;
              }>;
              learned.forEach((f) => onFactLearned?.(f.key, f.value));
            } catch {}
            return {
              ...m,
              content: m.content.replace(FACTS_RE, "").trimEnd(),
            };
          })
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Ugh jaan, kuch toh gadbad ho gayi 😅 Try again?",
                  }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, messages, engine, facts, onFactLearned, onSwitchToGemini, clearHistory]
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
  };
}
