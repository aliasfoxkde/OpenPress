import { useState, useCallback, useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { cn } from "@/lib/cn";

type EditorTab = "css" | "html" | "javascript";

const TAB_CONFIG: Record<EditorTab, { label: string; language: string; placeholder: string }> = {
  css: {
    label: "CSS",
    language: "css",
    placeholder: `/* Custom CSS overrides */\n\n:root {\n  --custom-color: #6366f1;\n}\n\n.my-custom-class {\n  font-size: 1.125rem;\n}`,
  },
  html: {
    label: "HTML",
    language: "html",
    placeholder: `<!-- Custom HTML injected before </body> -->\n\n<script>\n  console.log("Custom HTML loaded");\n</script>`,
  },
  javascript: {
    label: "JS",
    language: "javascript",
    placeholder: `// Custom JavaScript\n\nconsole.log("OpenPress custom script loaded");\n\n// DOM is ready when this runs\ndocument.addEventListener("DOMContentLoaded", () => {\n  // Your code here\n});`,
  },
};

interface CodeEditorPanelProps {
  open: boolean;
  onClose: () => void;
}

// Global singleton state so the panel persists across route changes
let globalCode: Record<EditorTab, string> = {
  css: "",
  html: "",
  javascript: "",
};

// Load from localStorage on module init
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("openpress-code-editor");
    if (saved) {
      const parsed = JSON.parse(saved);
      globalCode = { ...globalCode, ...parsed };
    }
  } catch {
    // ignore
  }
}

function saveToStorage(code: Record<EditorTab, string>) {
  try {
    localStorage.setItem("openpress-code-editor", JSON.stringify(code));
  } catch {
    // ignore
  }
}

// Inject custom code into the page
function injectCode(code: Record<EditorTab, string>) {
  // Remove old injections
  const oldStyle = document.getElementById("openpress-custom-css");
  if (oldStyle) oldStyle.remove();
  const oldScript = document.getElementById("openpress-custom-js");
  if (oldScript) oldScript.remove();
  const oldHtml = document.getElementById("openpress-custom-html");
  if (oldHtml) oldHtml.remove();

  // CSS
  if (code.css.trim()) {
    const style = document.createElement("style");
    style.id = "openpress-custom-css";
    style.textContent = code.css;
    document.head.appendChild(style);
  }

  // HTML
  if (code.html.trim()) {
    const container = document.createElement("div");
    container.id = "openpress-custom-html";
    container.innerHTML = code.html;
    document.body.appendChild(container);
  }

  // JavaScript
  if (code.javascript.trim()) {
    const script = document.createElement("script");
    script.id = "openpress-custom-js";
    script.textContent = code.javascript;
    document.body.appendChild(script);
  }
}

export function CodeEditorPanel({ open, onClose }: CodeEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("css");
  const [code, setCode] = useState<Record<EditorTab, string>>(globalCode);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleChange = useCallback((value: string | undefined) => {
    const updated = { ...code, [activeTab]: value || "" };
    setCode(updated);
    setHasUnsaved(true);
  }, [activeTab, code]);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleSave = useCallback(() => {
    globalCode = { ...code };
    saveToStorage(code);
    injectCode(code);
    setHasUnsaved(false);
  }, [code]);

  const handleReset = useCallback(() => {
    const empty: Record<EditorTab, string> = { css: "", html: "", javascript: "" };
    setCode(empty);
    globalCode = empty;
    saveToStorage(empty);
    injectCode(empty);
    setHasUnsaved(false);
  }, []);

  // Inject on mount
  useEffect(() => {
    injectCode(globalCode);
  }, []);

  // Keyboard shortcut: Ctrl+S to save, Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleSave, onClose]);

  // Close on outside click
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close
    const timer = setTimeout(() => window.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const tabCfg = TAB_CONFIG[activeTab];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed left-0 top-0 bottom-0 z-[70] w-full max-w-xl bg-surface border-r border-border shadow-2xl flex flex-col animate-slide-in-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-secondary">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary">Code Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close editor"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(Object.keys(TAB_CONFIG) as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "border-primary-600 text-primary-700 bg-surface"
                  : "border-transparent text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary"
              )}
            >
              <span className="uppercase">{TAB_CONFIG[tab].label}</span>
              {code[tab] && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            key={activeTab}
            height="100%"
            language={tabCfg.language}
            value={code[activeTab] || ""}
            onChange={handleChange}
            onMount={handleMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              lineNumbers: "on",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12 },
              placeholder: tabCfg.placeholder,
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              renderLineHighlight: "line",
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
            }}
            loading={
              <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                Loading editor...
              </div>
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface-secondary">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-tertiary">
              {code[activeTab].split("\n").length} lines
            </span>
            {hasUnsaved && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs text-text-tertiary hover:text-red-600 px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsaved}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                hasUnsaved
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-surface-tertiary text-text-tertiary cursor-not-allowed"
              )}
            >
              Save &amp; Apply
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
