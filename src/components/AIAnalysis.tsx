import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Cancel01Icon,
  Alert01Icon,
  Refresh01Icon,
  VolumeHighIcon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";
import type { PanelRow, RegressionResult, CustomParams } from "@/types";
import { buildAnalysisPrompt, buildTrendData } from "@/lib/buildPrompt";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useVoice } from "@/hooks/useVoice";
import { getLatestMonth, getEarliestMonth } from "@/lib/utils";

interface AIAnalysisProps {
  region: string;
  panel: PanelRow[];
  regression: RegressionResult | null;
  daysToFeed?: number;
  baselineDtf?: number;
  dailyWage?: number;
  monthlyBasket?: number;
  computeDaysToFeed: (row: PanelRow) => number;
  customParams?: CustomParams | null;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function AnalysisSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Loading analysis…">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted/70" />
        <div className="h-3 w-5/6 rounded-full bg-muted/70" />
        <div className="h-3 w-4/6 rounded-full bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted/70" />
        <div className="h-3 w-11/12 rounded-full bg-muted/70" />
        <div className="h-3 w-3/4 rounded-full bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-44 rounded-full bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
          <div className="h-3 w-5/6 rounded-full bg-muted/70" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
          <div className="h-3 w-4/6 rounded-full bg-muted/70" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
          <div className="h-3 w-5/6 rounded-full bg-muted/60" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted/70" />
        <div className="h-3 w-10/12 rounded-full bg-muted/70" />
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-5 mb-2 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-4 mb-1.5 text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-3 pl-4 list-disc marker:text-primary">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed text-foreground/90">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
          hr: () => <hr className="my-4 border-border/60" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-3 text-sm italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Streaming dots indicator ──────────────────────────────────────────────────

function StreamingIndicator({ region }: { region: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
      <span className="inline-flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </span>
      Generating analysis for{" "}
      {region === "CUSTOM" ? "custom scenario" : region === "PHILIPPINES" ? "the Philippines" : region}…
    </div>
  );
}

// ── Streaming cursor blink ────────────────────────────────────────────────────

function StreamingCursor() {
  return (
    <span
      className="inline-block w-0.5 h-3.5 bg-primary align-middle ml-0.5 animate-[blink_1s_step-end_infinite]"
      aria-hidden
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIAnalysis({
  region,
  panel,
  regression,
  daysToFeed,
  baselineDtf,
  dailyWage,
  monthlyBasket,
  computeDaysToFeed,
  customParams,
}: AIAnalysisProps) {
  const { markdown, status, error, generate, cancel } = useAIAnalysis();
  const { voiceStatus, speak, stopSpeaking } = useVoice();

  const latestMonth = getLatestMonth(panel);
  const earliestMonth = getEarliestMonth(panel);
  const trendData = buildTrendData(panel, region, computeDaysToFeed, customParams);

  // Auto-scroll into view on first streaming tick
  const cardRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (status === "streaming" && !scrolled.current) {
      scrolled.current = true;
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (status === "idle" || status === "done" || status === "error") {
      scrolled.current = false;
    }
  }, [status]);

  // Stop any ongoing speech when a new generation starts.
  useEffect(() => {
    if (status === "loading" || status === "streaming") {
      stopSpeaking();
    }
  }, [status]);

  const handleGenerate = () => {
    if (
      daysToFeed === undefined ||
      baselineDtf === undefined ||
      dailyWage === undefined ||
      monthlyBasket === undefined
    )
      return;

    generate(
      buildAnalysisPrompt({
        region,
        daysToFeed,
        baselineDtf,
        dailyWage,
        monthlyBasket,
        latestMonth,
        earliestMonth,
        trendData,
        regression,
        customParams,
      }),
    );
  };

  const isRunning = status === "loading" || status === "streaming";
  const isDone = status === "done";
  const hasContent = markdown.length > 0;
  const isSpeaking = voiceStatus === "speaking";
  const voiceSupported = voiceStatus !== "unsupported";

  return (
    <section ref={cardRef} className="scroll-mt-4">
      {/* Section header row */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-sm font-semibold">AI Insights</h2>

        <div className="flex items-center gap-2">
          {/* Voice button — only when fully streamed */}
          {isDone && hasContent && voiceSupported && (
            isSpeaking ? (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className="gap-2"
              >
                <HugeiconsIcon icon={StopCircleIcon} strokeWidth={1.5} className="size-4" />
                Stop reading
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => speak(markdown)}
                className="gap-2"
              >
                <HugeiconsIcon icon={VolumeHighIcon} strokeWidth={1.5} className="size-4" />
                Read aloud
              </Button>
            )
          )}

          {/* Stop generation / Regenerate */}
          {isRunning ? (
            <Button variant="outline" onClick={cancel} className="gap-2">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-4" />
              Stop
            </Button>
          ) : hasContent ? (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={daysToFeed === undefined}
              className="gap-2"
            >
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={1.5} className="size-4" />
              Regenerate
            </Button>
          ) : null}
        </div>
      </div>

      {/* Content card */}
      <Card className="gap-0 py-0 rounded-xl shadow-sm">
        <CardContent className="p-5">
          {/* Idle empty state — Generate button lives here */}
          {status === "idle" && !hasContent && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="rounded-full p-3 bg-primary/15 dark:bg-primary/25">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  strokeWidth={1.5}
                  className="size-6 text-primary"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  CLAUDE Advisor
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Get a plain-language breakdown of the food affordability data
                  for{" "}
                  {region === "CUSTOM" ? "your custom scenario" : region === "PHILIPPINES" ? "the Philippines" : region}
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={daysToFeed === undefined}
                className="gap-2 mt-1"
              >
                Generate Analysis
              </Button>
            </div>
          )}

          {/* Loading skeleton — before first token */}
          {status === "loading" && !hasContent && <AnalysisSkeleton />}

          {/* Error state */}
          {status === "error" && (
            <div
              className="rounded-xl p-4 flex gap-3 items-start"
              style={{ background: "oklch(0.96 0.03 24 / 0.5)" }}
            >
              <HugeiconsIcon
                icon={Alert01Icon}
                strokeWidth={1.5}
                className="size-4 text-destructive shrink-0 mt-0.5"
              />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-destructive">
                  Could not generate analysis
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {error}
                </p>
                {error?.includes("VITE_GEMINI_API_KEY") && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get a free key at{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-primary"
                    >
                      aistudio.google.com/apikey
                    </a>
                    , then add it to your{" "}
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                      .env
                    </code>{" "}
                    file:
                    <br />
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                      VITE_GEMINI_API_KEY=your_key_here
                    </code>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Streaming / done content */}
          {hasContent && (
            <>
              {isRunning && <StreamingIndicator region={region} />}
              <MarkdownContent content={markdown} />
              {status === "streaming" && <StreamingCursor />}
              {isDone && (
                <p className="mt-4 text-[0.65rem] text-muted-foreground/60 border-t border-border/50 pt-3">
                  Generated by <strong>CLAUDE Advisor</strong> · AI-generated
                  — always verify with official PSA/NWPC data.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
