import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu } from "lucide-react";
import type { ThinkingStep } from "@/hooks/use-kiku-chat";

interface ThinkingAccordionProps {
  steps: ThinkingStep[];
  isStreaming: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  consultDeepQuantumBrain: "quantum brain",
  saveUserFact: "memory core",
};

export function ThinkingAccordion({ steps, isStreaming }: ThinkingAccordionProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!isStreaming && steps.length > 0) {
      const t = setTimeout(() => setOpen(false), 2200);
      return () => clearTimeout(t);
    }
  }, [isStreaming, steps.length]);

  if (steps.length === 0) return null;

  return (
    <div
      className="mb-2 rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all duration-150"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <Cpu
          size={10}
          style={{ color: "var(--neon-teal)", flexShrink: 0 }}
          className={isStreaming ? "animate-pulse" : ""}
        />
        <span
          className="text-[10px] font-mono font-medium flex-1"
          style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}
        >
          {isStreaming ? "thinking…" : `${steps.length} step${steps.length > 1 ? "s" : ""} executed`}
        </span>
        <ChevronDown
          size={10}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Console body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-3 pb-2.5 pt-0.5 flex flex-col gap-1.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.18 }}
                  className="flex items-start gap-2"
                >
                  <span
                    className="text-[10px] font-mono flex-shrink-0 mt-px"
                    style={{
                      color:
                        step.type === "tool-call"
                          ? "var(--neon-teal)"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {step.type === "tool-call" ? "→" : "←"}
                  </span>
                  <span
                    className="text-[10px] font-mono leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    {step.type === "tool-call" ? (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.55)" }}>
                          {TOOL_LABELS[step.toolName] ?? step.toolName}
                        </span>
                        {step.detail && (
                          <span style={{ color: "rgba(255,255,255,0.25)" }}>
                            {" "}
                            ({step.detail.slice(0, 60)}
                            {step.detail.length > 60 ? "…" : ""})
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.28)" }}>
                        {TOOL_LABELS[step.toolName] ?? step.toolName} responded
                      </span>
                    )}
                  </span>
                </motion.div>
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono" style={{ color: "var(--neon-teal)", opacity: 0.5 }}>
                    ▋
                  </span>
                  <span className="text-[10px] font-mono animate-pulse" style={{ color: "rgba(255,255,255,0.2)" }}>
                    processing…
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
