import { useState, useRef, useEffect } from "react";

// Strip markdown syntax so the speech synthesiser reads clean prose.
function stripMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^#{1,6}\s+/gm, "")
    // Bold / italic (order matters — ** before *)
    .replace(/\*\*\*(.+?)\*\*\*/gs, "$1")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/___(.+?)___/gs, "$1")
    .replace(/__(.+?)__/gs, "$1")
    .replace(/_(.+?)_/gs, "$1")
    // Strikethrough
    .replace(/~~(.+?)~~/gs, "$1")
    // Fenced & inline code
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "")
    // Links — keep label text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // List markers
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Blockquotes
    .replace(/^>\s*/gm, "")
    // Horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Collapse excess blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type VoiceStatus = "idle" | "speaking" | "unsupported";

export interface UseVoiceReturn {
  voiceStatus: VoiceStatus;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export function useVoice(): UseVoiceReturn {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(
    supported ? "idle" : "unsupported",
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Always cancel on unmount so speech doesn't outlive the component.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = (text: string) => {
    if (!supported) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utteranceRef.current = utterance;

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setVoiceStatus("speaking");
    utterance.onend = () => setVoiceStatus("idle");
    utterance.onerror = () => setVoiceStatus("idle");

    window.speechSynthesis.speak(utterance);
    // Optimistically set state immediately so the button updates right away.
    setVoiceStatus("speaking");
  };

  const stopSpeaking = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setVoiceStatus("idle");
  };

  return { voiceStatus, speak, stopSpeaking };
}
