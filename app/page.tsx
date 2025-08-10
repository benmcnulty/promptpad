'use client'

import { useCallback, useMemo, useState, useEffect } from "react";
import StatusBar from "@/components/StatusBar";
import TokenCounter from "@/components/TokenCounter";
import ProgressTracker from "@/components/ProgressTracker";
import { useRefine } from "@/hooks/useRefine";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<
    Array<{ timestamp: string; type: "request" | "response" | "system"; content: any }>
  >([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const { state, statusSummary, run, reset } = useRefine("gpt-oss:20b", 0.2);

  const canRefine = useMemo(
    () => inputText.trim().length > 0 && !state.loading,
    [inputText, state.loading]
  );
  const canReinforce = useMemo(
    () => outputText.trim().length > 0 && !state.loading,
    [outputText, state.loading]
  );

  useEffect(() => {
    const dismissed = localStorage.getItem("promptpad-welcome-dismissed");
    if (dismissed === "true") setShowWelcome(false);
  }, []);

  const dismissWelcome = useCallback(() => {
    if (dontShowAgain) localStorage.setItem("promptpad-welcome-dismissed", "true");
    setShowWelcome(false);
  }, [dontShowAgain]);

  const addDebugLog = useCallback(
    (type: "request" | "response" | "system", content: any) => {
      const timestamp = new Date().toISOString();
      setDebugLogs((prev) => [...prev.slice(-49), { timestamp, type, content }]);
    },
    []
  );

  useEffect(() => {
    if (!showWelcome) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissWelcome();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showWelcome, dismissWelcome]);

  const clearDebugLogs = useCallback(() => setDebugLogs([]), []);

  const copyToClipboard = useCallback(async () => {
    if (!outputText.trim()) return;
    
    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [outputText]);

  const onRefine = useCallback(async () => {
    const requestPayload = {
      mode: "refine",
      input: inputText,
      model: "gpt-oss:20b",
      temperature: 0.2,
    };
    addDebugLog(
      "system",
      `Starting refine operation for: "${inputText.slice(0, 50)}${
        inputText.length > 50 ? "..." : ""
      }"`
    );
    addDebugLog("request", requestPayload);
    try {
      const warnTimer = setTimeout(() => {
        addDebugLog("system", "⏳ Model still processing... continuing to wait (no timeout abort)");
      }, 120000);
      const res = await run("refine", inputText);
      clearTimeout(warnTimer);
      addDebugLog("response", res);
      if (res?.systemPrompt)
        addDebugLog("system", `System Prompt Used:\n${res.systemPrompt}`);
      if (res?.fallbackUsed)
        addDebugLog("system", "⚠️ Using development fallback - Ollama unavailable");
      if (
        res &&
        res.output &&
        typeof res.output === "string" &&
        res.output.trim().length > 0
      ) {
        addDebugLog(
          "system",
          `✅ Successfully set output (${res.output.length} chars)`
        );
        setOutputText(res.output);
      } else {
        addDebugLog("system", `⚠️ Invalid output: ${JSON.stringify(res)}`);
      }
    } catch (error) {
      addDebugLog("system", `💥 Error: ${error}`);
    }
  }, [run, inputText, outputText, addDebugLog]);

  const onReinforce = useCallback(async () => {
    const warnTimer = setTimeout(() => {
      addDebugLog("system", "⏳ Model still processing reinforce request... continuing to wait");
    }, 120000);
    const res = await run("reinforce", outputText);
    clearTimeout(warnTimer);
    if (res && res.output) setOutputText(res.output);
  }, [run, outputText, addDebugLog]);

  return (
    <div className="h-screen flex flex-col gradient-surface overflow-hidden">
      {/* Main App Content (disabled when welcome modal open) */}
      <div
        className={`flex flex-col h-full ${showWelcome ? 'pointer-events-none' : ''}`}
        {...(showWelcome ? { 'aria-hidden': true } : {})}
      >
      {/* Header */}
      <header className="glass border-b border-white/20 px-6 py-4 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient">
            Promptpad
          </h1>
          <div className="text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/40 shadow-soft">
            Local-first prompt drafting
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full gap-4 p-2 sm:p-4 min-h-0 overflow-hidden">
        {/* Left Pane - Input */}
        <div className="flex-1 lg:w-1/2 flex flex-col glass rounded-xl border border-white/30 shadow-elegant backdrop-blur-md overflow-hidden min-h-0">
          <div className="gradient-secondary p-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                  clipRule="evenodd"
                />
              </svg>
              Input Draft
            </h2>
            <div className="text-white/90 text-sm">
              Enter your terse instructions to expand into structured prompts
            </div>
          </div>
          <div className="flex-1 p-4 min-h-0">
            <textarea
              className="w-full h-full resize-none bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-lg p-4 form-control focus-visible shadow-soft transition-all duration-200 hover:bg-white/90 focus:bg-white/95 focus:border-[color:var(--primary-start)] placeholder:text-slate-700 text-slate-900"
              placeholder={`Enter your prompt ideas here...\n\nExample: "Create a marketing email for new product launch"\n\nPress Refine to expand into a structured, copy-ready prompt.`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Prompt input area"
            />
          </div>
          <div className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <TokenCounter text={inputText} className="order-2 sm:order-1" />
              <button
                type="button"
                className="order-1 sm:order-2 gradient-primary text-white px-6 py-3 rounded-lg font-semibold shadow-elegant hover:shadow-lg transform hover:scale-105 focus-visible disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 transition-all duration-200 flex items-center"
                disabled={!canRefine}
                aria-label="Refine prompt"
                onClick={onRefine}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 8.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                Refine
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 font-medium bg-white/60 px-3 py-1 rounded-md backdrop-blur-sm border border-white/40">
                {statusSummary}
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700 focus-visible font-medium transition-colors duration-200 bg-white/60 hover:bg-white/80 px-3 py-1 rounded-md backdrop-blur-sm border border-white/40"
                onClick={reset}
                aria-label="Reset progress"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        {/* Right Pane - Output */}
        <div className="flex-1 lg:w-1/2 flex flex-col glass rounded-xl border border-white/30 shadow-elegant backdrop-blur-md overflow-hidden mt-4 lg:mt-0 min-h-0">
          <div className="gradient-secondary p-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.107 10.5a.75.75 0 00-1.214 1.061l1.586 2.286a.75.75 0 001.214-.057l3.857-5.657z"
                  clipRule="evenodd"
                />
              </svg>
              Refined Output
            </h2>
            <div className="text-white/90 text-sm">
              Your expanded, copy-ready prompt will appear here
            </div>
          </div>
          <div className="flex-1 p-4 min-h-0 relative">
            <textarea
              className={`w-full h-full resize-none bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-lg p-4 form-control focus-visible shadow-soft transition-all duration-200 hover:bg-white/90 focus:bg-white/95 focus:border-cyan-300 placeholder:text-slate-700 text-slate-900 ${state.loading ? 'pointer-events-none' : ''}`}
              placeholder={`Your refined prompt will appear here...\n\nAfter refining, you can edit the output and use 'Reinforce' to tighten and optimize your changes.`}
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              aria-label="Prompt output area"
              disabled={state.loading}
            />
            
            {/* Loading Overlay */}
            {state.loading && (
              <div className="absolute inset-4 rounded-lg flex items-center justify-center loading-enhanced-container backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-5">
                  <div className="loading-stage">
                    <div className="loading-ring" />
                    <div className="loading-ring segmented" />
                    <div className="loading-arc" />
                    <div className="loading-arc secondary" />
                    <div className="loading-orbits">
                      <div className="loading-orbit-dot dot1" />
                      <div className="loading-orbit-dot dot2" />
                      <div className="loading-orbit-dot dot3" />
                    </div>
                    <div className="loading-core-glow" />
                  </div>
                  <div className="w-48">
                    <div className="loading-progress-bar mb-3" />
                    <div className="text-center text-sm leading-tight">
                      <div className="loading-text-strong mb-1">Refining prompt</div>
                      <div className="loading-subtle">Model is generating – this can take a moment</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <TokenCounter text={outputText} />
                {outputText.trim() && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className={`flex items-center px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      copySuccess 
                        ? 'bg-emerald-500 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800 border border-white/40 shadow-soft'
                    }`}
                    aria-label="Copy refined prompt to clipboard"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      {copySuccess ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      )}
                      {!copySuccess && (
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      )}
                    </svg>
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-400 text-white rounded-lg font-medium shadow-soft opacity-50 cursor-not-allowed transition-all duration-200"
                  disabled
                  aria-label="Undo last change"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.793 2.232a.75.75 0 01-.025 1.06L4.887 6H13.5a7.5 7.5 0 010 15H9a.75.75 0 010-1.5h4.5a6 6 0 000-12H4.887l2.88 2.708a.75.75 0 11-1.035 1.085l-4.25-4a.75.75 0 010-1.085l4.25-4a.75.75 0 011.06.025z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Undo
                </button>
                <button
                  type="button"
                  className="gradient-secondary text-white px-6 py-3 rounded-lg font-semibold shadow-elegant hover:shadow-lg transform hover:scale-105 focus-visible disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 transition-all duration-200 flex items-center"
                  disabled={!canReinforce}
                  aria-label="Reinforce edited prompt"
                  onClick={onReinforce}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                  </svg>
                  Reinforce
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/40">
                Usage: <span className="font-mono font-semibold">in {state.usage?.input_tokens ?? 0} · out {state.usage?.output_tokens ?? 0}</span>
              </div>
              <div className="w-full lg:w-auto lg:min-w-0 lg:flex-1 lg:max-w-md">
                <ProgressTracker steps={state.steps} compact className="lg:hidden" />
                <ProgressTracker steps={state.steps} className="hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Debug Panel */}
      {showDebug && (
        <div className="border-t border-white/20 bg-gray-900 text-green-400 font-mono text-xs max-h-80 overflow-hidden flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
            <span className="text-green-300 font-semibold">🖥️ Debug Terminal</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => { localStorage.removeItem('promptpad-welcome-dismissed'); setShowWelcome(true); setDontShowAgain(false); }}
                className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-xs transition-colors duration-200"
                title="Reset welcome modal dismissed setting"
                aria-label="Reset welcome modal"
                data-testid="reset-welcome"
              >
                Reset Welcome
              </button>
              <button
                type="button"
                onClick={clearDebugLogs}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors duration-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowDebug(false)}
                className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No debug logs yet. Perform a refine operation to see debug output.</div>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="border-l-2 border-gray-700 pl-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-1 rounded text-xs font-bold ${
                        log.type === "request"
                          ? "bg-blue-700 text-blue-200"
                          : log.type === "response"
                          ? "bg-yellow-700 text-yellow-200"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-green-300 whitespace-pre-wrap break-words">
                    {typeof log.content === "string"
                      ? log.content
                      : JSON.stringify(log.content, null, 2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <StatusBar onDebugToggle={setShowDebug} debugOpen={showDebug} />
  </div>

      {/* Welcome Modal */}
      {showWelcome && !inputText && !outputText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          onClick={dismissWelcome}
        >
          <div
            className="bg-white/95 backdrop-blur-md text-center max-w-md mx-4 p-8 rounded-2xl border border-white/60 shadow-elegant relative pointer-events-auto"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={dismissWelcome}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors duration-200 flex items-center justify-center focus-visible"
              aria-label="Close welcome message"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Welcome to Promptpad</h3>
            <p className="text-slate-700 mb-6 leading-relaxed font-medium">
              Your local-first prompt drafting tool. Enter a brief idea in the left panel and click <span className="font-bold text-gradient">Refine</span> to expand it into a structured prompt.
            </p>
            <div className="text-sm text-slate-800 bg-slate-100/90 backdrop-blur-sm p-4 rounded-xl border border-slate-300/60 shadow-soft mb-6">
              <div className="font-bold mb-2 text-slate-900">Prerequisites:</div>
              <code className="block font-mono text-xs bg-white p-3 rounded-lg border border-slate-200 shadow-soft text-slate-800">
                ollama pull gpt-oss:20b
              </code>
            </div>
            {/* Don't show again checkbox */}
            <div className="flex items-center justify-center mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-colors duration-200 ${dontShowAgain ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300 hover:border-slate-400"}`}
                >
                  {dontShowAgain && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-600 font-medium">Don&apos;t show this again</span>
              </label>
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              className="gradient-primary text-white px-6 py-2.5 rounded-lg font-semibold shadow-soft hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus-visible"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
