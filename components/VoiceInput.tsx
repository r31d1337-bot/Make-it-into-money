"use client";

import { useEffect, useRef, useState } from "react";

// Browser SpeechRecognition isn't in the standard DOM lib — minimal typing.
type SRResult = { transcript: string };
type SRAlternative = { 0: SRResult; length: number };
type SREvent = {
  resultIndex: number;
  results: ArrayLike<SRAlternative & { isFinal: boolean }>;
};
type SREndEvent = { error?: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onend: ((e: SREndEvent) => void) | null;
  onerror: ((e: SREndEvent) => void) | null;
};

function getSR(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

/**
 * Mic button that dictates into the adjacent textarea via the Web Speech API.
 * Renders nothing if the browser doesn't support SpeechRecognition
 * (Firefox, non-Chrome/Safari) so users never see a broken button.
 */
export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(!!getSR());
  }, []);

  function start() {
    const Ctor = getSR();
    if (!Ctor) return;
    setError(null);
    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        let finalText = "";
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (finalText) onTranscript(finalText);
        else if (interim) onTranscript(interim);
      };
      rec.onend = () => setListening(false);
      rec.onerror = (e) => {
        setError(e.error || "Mic error");
        setListening(false);
      };
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }

  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        title={listening ? "Stop" : "Speak your idea"}
        aria-label={listening ? "Stop recording" : "Speak your idea"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          listening
            ? "border-red-500/60 bg-red-500/15 text-red-300 animate-pulse"
            : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white disabled:opacity-40"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </>
  );
}
