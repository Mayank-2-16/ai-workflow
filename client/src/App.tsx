import { FormEvent, useState } from "react";
import {
  callTestLlm,
  callSummarizeUrl,
  callRunWorkflow,
  type WorkflowRunResponse,
} from "./api";

function App() {
  // Test LLM state
  const [prompt, setPrompt] = useState("");
  const [promptResult, setPromptResult] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // URL Summarizer state
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Workflow Runner state
  const [workflowId, setWorkflowId] = useState("");
  const [workflowContextJson, setWorkflowContextJson] = useState(
    '{\n  "url": "https://example.com"\n}'
  );
  const [workflowResult, setWorkflowResult] = useState<WorkflowRunResponse | null>(
    null
  );
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  async function handlePromptSubmit(e: FormEvent) {
    e.preventDefault();
    setPromptError(null);
    setPromptResult(null);
    setPromptLoading(true);

    try {
      const res = await callTestLlm(prompt);
      setPromptResult(res.result);
    } catch (err: any) {
      setPromptError(err.message || "Something went wrong");
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleSummarizeSubmit(e: FormEvent) {
    e.preventDefault();
    setSummaryError(null);
    setSummary(null);
    setSummaryLoading(true);

    try {
      const res = await callSummarizeUrl(url);
      setSummary(res.summary);
    } catch (err: any) {
      setSummaryError(err.message || "Something went wrong");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleWorkflowSubmit(e: FormEvent) {
    e.preventDefault();
    setWorkflowError(null);
    setWorkflowResult(null);
    setWorkflowLoading(true);

    try {
      let context: Record<string, any> = {};
      if (workflowContextJson.trim()) {
        try {
          context = JSON.parse(workflowContextJson);
        } catch {
          throw new Error("Context JSON is invalid");
        }
      }

      const res = await callRunWorkflow(workflowId.trim(), context);
      setWorkflowResult(res);
    } catch (err: any) {
      setWorkflowError(err.message || "Something went wrong");
    } finally {
      setWorkflowLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Workflow Hub – Playground
          </h1>
          <p className="text-slate-400">
            MERN + TypeScript + Hugging Face + Tailwind. This is your testing
            ground before the full visual workflow builder.
          </p>
        </header>

        {/* Cards container */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Test LLM card */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
            <h2 className="text-lg font-semibold mb-2">1. Test LLM (Text Generation)</h2>
            <p className="text-sm text-slate-400 mb-3">
              Sends your prompt to the Hugging Face Router using an LLM model.
            </p>
            <form onSubmit={handlePromptSubmit} className="space-y-3">
              <textarea
                className="w-full min-h-[90px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Write a short motivational quote about learning."
              />
              <button
                type="submit"
                disabled={promptLoading || !prompt.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {promptLoading ? "Generating..." : "Send to LLM"}
              </button>
            </form>
            {promptError && (
              <p className="mt-2 text-sm text-red-400">{promptError}</p>
            )}
            {promptResult && (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200">
                {promptResult}
              </pre>
            )}
          </section>

          {/* URL Summarizer card */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
            <h2 className="text-lg font-semibold mb-2">2. URL Summarizer</h2>
            <p className="text-sm text-slate-400 mb-3">
              Backend fetches the page, strips HTML, and the LLM summarizes it.
            </p>
            <form onSubmit={handleSummarizeSubmit} className="space-y-3">
              <input
                type="url"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a news article URL..."
              />
              <button
                type="submit"
                disabled={summaryLoading || !url.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {summaryLoading ? "Summarizing..." : "Summarize URL"}
              </button>
            </form>
            {summaryError && (
              <p className="mt-2 text-sm text-red-400">{summaryError}</p>
            )}
            {summary && (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 max-h-64 overflow-auto">
                {summary}
              </pre>
            )}
          </section>
        </div>

        {/* Workflow Runner card (full width) */}
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
          <h2 className="text-lg font-semibold mb-2">3. Run Workflow by ID</h2>
          <p className="text-sm text-slate-400 mb-3">
            Executes a saved workflow on the backend. Context JSON is passed as
            the initial data that flows through steps.
          </p>

          <form onSubmit={handleWorkflowSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Workflow ID
              </label>
              <input
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                placeholder="Paste the MongoDB workflow _id here"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Context JSON
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={workflowContextJson}
                onChange={(e) => setWorkflowContextJson(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Example for the sample workflow: {"{ \"url\": \"https://example.com\" }"}
              </p>
            </div>

            <button
              type="submit"
              disabled={workflowLoading || !workflowId.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {workflowLoading ? "Running..." : "Run Workflow"}
            </button>
          </form>

          {workflowError && (
            <p className="mt-2 text-sm text-red-400">{workflowError}</p>
          )}

          {workflowResult && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold mb-1">Steps run</h3>
                <ul className="space-y-1 text-xs">
                  {workflowResult.stepsRun.map((step) => (
                    <li
                      key={step.id}
                      className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-800 px-2 py-1"
                    >
                      <span>
                        <span className="font-medium">{step.type}</span>{" "}
                        <span className="text-slate-500">({step.id})</span>
                      </span>
                      <span
                        className={
                          step.status === "success"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {step.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

                <div>
                  <h3 className="text-sm font-semibold mb-1">Final context</h3>
                  <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] max-h-64 overflow-auto">
                    {JSON.stringify(workflowResult.context, null, 2)}
                  </pre>
                </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;



// import { FormEvent, useState } from "react";
// import { callTestLlm, callSummarizeUrl } from "./api";

// function App() {
//   const [prompt, setPrompt] = useState("");
//   const [promptResult, setPromptResult] = useState<string | null>(null);
//   const [promptLoading, setPromptLoading] = useState(false);
//   const [promptError, setPromptError] = useState<string | null>(null);

//   const [url, setUrl] = useState("");
//   const [summary, setSummary] = useState<string | null>(null);
//   const [summaryLoading, setSummaryLoading] = useState(false);
//   const [summaryError, setSummaryError] = useState<string | null>(null);

//   async function handlePromptSubmit(e: FormEvent) {
//     e.preventDefault();
//     setPromptError(null);
//     setPromptResult(null);
//     setPromptLoading(true);

//     try {
//       const res = await callTestLlm(prompt);
//       setPromptResult(res.result);
//     } catch (err: any) {
//       setPromptError(err.message || "Something went wrong");
//     } finally {
//       setPromptLoading(false);
//     }
//   }

//   async function handleSummarizeSubmit(e: FormEvent) {
//     e.preventDefault();
//     setSummaryError(null);
//     setSummary(null);
//     setSummaryLoading(true);

//     try {
//       const res = await callSummarizeUrl(url);
//       setSummary(res.summary);
//     } catch (err: any) {
//       setSummaryError(err.message || "Something went wrong");
//     } finally {
//       setSummaryLoading(false);
//     }
//   }

//   return (
//     <div
//       style={{
//         fontFamily: "system-ui, sans-serif",
//         padding: "2rem",
//         maxWidth: "800px",
//         margin: "0 auto",
//       }}
//     >
//       <h1>AI Playground (Hugging Face + MERN)</h1>
//       <p>This is our warm-up project before the full Workflow Automation Hub 🚀</p>

//       {/* Section 1: Test LLM */}
//       <section style={{ marginTop: "2rem" }}>
//         <h2>1. Test LLM (Text Generation)</h2>
//         <form onSubmit={handlePromptSubmit}>
//           <textarea
//             style={{ width: "100%", minHeight: "80px" }}
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             placeholder="Type something like: 'Write a short motivational quote about learning.'"
//           />
//           <button
//             type="submit"
//             disabled={promptLoading || !prompt.trim()}
//             style={{ marginTop: "0.5rem" }}
//           >
//             {promptLoading ? "Generating..." : "Send to LLM"}
//           </button>
//         </form>

//         {promptError && (
//           <p style={{ color: "red", marginTop: "0.5rem" }}>{promptError}</p>
//         )}
//         {promptResult && (
//           <pre
//             style={{
//               background: "#f5f5f5",
//               padding: "1rem",
//               marginTop: "1rem",
//               whiteSpace: "pre-wrap",
//             }}
//           >
//             {promptResult}
//           </pre>
//         )}
//       </section>

//       {/* Section 2: URL Summarizer */}
//       <section style={{ marginTop: "3rem" }}>
//         <h2>2. URL Summarizer</h2>
//         <form onSubmit={handleSummarizeSubmit}>
//           <input
//             type="url"
//             style={{ width: "100%", padding: "0.5rem" }}
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             placeholder="Paste a news article URL..."
//           />
//           <button
//             type="submit"
//             disabled={summaryLoading || !url.trim()}
//             style={{ marginTop: "0.5rem" }}
//           >
//             {summaryLoading ? "Summarizing..." : "Summarize URL"}
//           </button>
//         </form>

//         {summaryError && (
//           <p style={{ color: "red", marginTop: "0.5rem" }}>{summaryError}</p>
//         )}
//         {summary && (
//           <pre
//             style={{
//               background: "#f5f5f5",
//               padding: "1rem",
//               marginTop: "1rem",
//               whiteSpace: "pre-wrap",
//             }}
//           >
//             {summary}
//           </pre>
//         )}
//       </section>
//     </div>
//   );
// }

// export default App;
