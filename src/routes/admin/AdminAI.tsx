import { useState } from "react";
import { api } from "../../lib/api";

export default function AdminAI() {
  const [activeTab, setActiveTab] = useState<"generate" | "suggest" | "translate" | "summarize">("generate");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await api.post("/api/ai/generate", {
        prompt: input,
        system: "You are a helpful content assistant for a CMS.",
      });
      setOutput(res.data.text || "No output");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async (type: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await api.post("/api/ai/suggest", { type, content: input });
      setOutput(JSON.stringify(res.data.suggestions, null, 2));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Suggestion failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await api.post("/api/ai/summarize", { text: input });
      setOutput(res.data.summary || "No summary");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await api.post("/api/ai/translate", { text: input, target_lang: targetLang });
      setOutput(res.data.translation || "No translation");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800">
          Powered by Workers AI
        </span>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["generate", "suggest", "summarize", "translate"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(""); setOutput(""); }}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {activeTab === "generate" && "Enter your prompt"}
          {activeTab === "suggest" && "Paste content to get suggestions for"}
          {activeTab === "summarize" && "Paste text to summarize"}
          {activeTab === "translate" && "Enter text to translate"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder={
            activeTab === "generate"
              ? "Write a blog post about..."
              : activeTab === "suggest"
                ? "Paste your article or content here..."
                : activeTab === "summarize"
                  ? "Paste long text to summarize..."
                  : "Enter text to translate..."
          }
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {activeTab === "generate" && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        )}

        {activeTab === "suggest" && (
          <>
            <button onClick={() => handleSuggest("title")} disabled={loading} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
              Suggest Titles
            </button>
            <button onClick={() => handleSuggest("excerpt")} disabled={loading} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
              Suggest Excerpts
            </button>
            <button onClick={() => handleSuggest("seo")} disabled={loading} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
              SEO Meta
            </button>
            <button onClick={() => handleSuggest("tags")} disabled={loading} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
              Suggest Tags
            </button>
          </>
        )}

        {activeTab === "summarize" && (
          <button onClick={handleSummarize} disabled={loading} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        )}

        {activeTab === "translate" && (
          <>
            {["en", "es", "fr", "de", "ja", "zh", "ko", "pt", "ar", "hi"].map((lang) => (
              <button
                key={lang}
                onClick={() => handleTranslate(lang)}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Result</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-900">{output}</pre>
        </div>
      )}
    </div>
  );
}
