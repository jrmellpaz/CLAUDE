import { useState, useRef } from "react";
import { GoogleGenAI } from "@google/genai";

export type AIAnalysisStatus = "idle" | "loading" | "streaming" | "done" | "error";

export interface AIAnalysisState {
  markdown: string;
  status: AIAnalysisStatus;
  error: string | null;
}

export interface UseAIAnalysisReturn extends AIAnalysisState {
  generate: (prompt: string) => Promise<void>;
  cancel: () => void;
}

const MODEL = "gemini-2.0-flash";

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [state, setState] = useState<AIAnalysisState>({
    markdown: "",
    status: "idle",
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const cancel = () => {
    abortRef.current?.abort();
    setState((s) =>
      s.status === "loading" || s.status === "streaming"
        ? { ...s, status: "idle" }
        : s,
    );
  };

  const generate = async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ markdown: "", status: "loading", error: null });

    const client = getClient();
    if (!client) {
      setState({
        markdown: "",
        status: "error",
        error: "No API key found. Add VITE_GEMINI_API_KEY to your .env file.",
      });
      return;
    }

    try {
      const stream = await client.models.generateContentStream({
        model: MODEL,
        contents: prompt,
      });

      setState((s) => ({ ...s, status: "streaming" }));
      let fullText = "";

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const token = chunk.text ?? "";
        fullText += token;
        setState((s) => ({ ...s, markdown: fullText }));
      }

      if (!controller.signal.aborted) {
        setState((s) => ({ ...s, status: "done" }));
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      const message = err instanceof Error ? err.message : "Unknown error";
      const isAuthError =
        message.includes("API_KEY") ||
        message.includes("403") ||
        message.includes("401");

      setState({
        markdown: "",
        status: "error",
        error: isAuthError
          ? "Invalid API key. Check that VITE_GEMINI_API_KEY in your .env is correct."
          : `Gemini error: ${message}`,
      });
    }
  };

  return { ...state, generate, cancel };
}
