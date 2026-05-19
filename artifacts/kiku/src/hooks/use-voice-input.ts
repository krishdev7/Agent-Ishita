import { useState, useRef, useCallback, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim()) onTranscript(transcript.trim());
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => () => { recRef.current?.stop(); }, []);

  return { isListening, isSupported, toggle };
}
