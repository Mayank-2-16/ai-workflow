import { FormEvent, useEffect, useState } from "react";
import {
  callTestLlm,
  callSummarizeUrl,
  callRunWorkflow,
  type WorkflowRunResponse,
  type StepType,
  type CreateWorkflowInput,
  createWorkflow,
  type Workflow,
} from "./api";

type StepForm = {
  id: string;
  type: StepType;
  config: Record<string, any>;
};

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

  // Create Workflow state
  const [wfName, setWfName] = useState("Summarize URL Workflow");
  const [wfDescription, setWfDescription] = useState(
    "Fetch a URL and summarize its content using LLM."
  );
  const [wfSteps, setWfSteps] = useState<StepForm[]>([
    {
      id: "step1",
      type: "FETCH_URL",
      config: { sourceField: "url", targetField: "pageContent", maxChars: 6000 },
    },
    {
      id: "step2",
      type: "LLM_SUMMARIZE",
      config: { inputField: "pageContent", outputField: "summary" },
    },
  ]);
  const [wfCreating, setWfCreating] = useState(false);
  const [wfCreateError, setWfCreateError] = useState<string | null>(null);
  const [wfCreated, setWfCreated] = useState<Workflow | null>(null);

  // Pre-fill workflowId in runner when a new workflow is created
  useEffect(() => {
    if (wfCreated?._id) {
      setWorkflowId(wfCreated._id);
    }
  }, [wfCreated]);

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

  async function handleWorkflowRunSubmit(e: FormEvent) {
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

  function addStep() {
    const nextIndex = wfSteps.length + 1;
    setWfSteps((prev) => [
      ...prev,
      {
        id: `step${nextIndex}`,
        type: "ECHO",
        config: { message: "New step", outputField: `echo${nextIndex}` },
      },
    ]);
  }

  function removeStep(index: number) {
    setWfSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStepType(index: number, type: StepType) {
    setWfSteps((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        type,
        // basic sensible defaults per type
        config:
          type === "FETCH_URL"
            ? { sourceField: "url", targetField: "pageContent", maxChars: 6000 }
            : type === "LLM_SUMMARIZE"
            ? { inputField: "pageContent", outputField: "summary" }
            : type === "LLM_GENERAL"
            ? {
                promptTemplate:
                  "Summarize this text: {{pageContent}}",
                outputField: "llmResult",
              }
            : type === "TRANSFORM_TEXT"
            ? {
                inputField: "llmResult",
                outputField: "llmResultUpper",
                operation: "uppercase",
              }
            : { message: "Echo from step", outputField: "echo" },
      };
      return copy;
    });
  }

  function updateStepConfigField(
    index: number,
    field: string,
    value: string
  ) {
    setWfSteps((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        config: {
          ...copy[index].config,
          [field]: value,
        },
      };
      return copy;
    });
  }

  async function handleCreateWorkflowSubmit(e: FormEvent) {
    e.preventDefault();
    setWfCreateError(null);
    setWfCreating(true);
    setWfCreated(null);

    try {
      const stepsPayload = wfSteps.map((step, index) => ({
        id: step.id || `step${index + 1}`,
        type: step.type,
        order: index + 1,
        config: step.config,
      }));

      const payload: CreateWorkflowInput = {
        name: wfName.trim(),
        description: wfDescription.trim(),
        trigger: "manual",
        steps: stepsPayload,
      };

      const created = await createWorkflow(payload);
      setWfCreated(created);
    } catch (err: any) {
      setWfCreateError(err.message || "Failed to create workflow");
    } finally {
      setWfCreating(false);
    }
  }

  function renderStepConfigInputs(step: StepForm, index: number) {
    const c = step.config || {};
    switch (step.type) {
      case "FETCH_URL":
        return (
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Source field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.sourceField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "sourceField", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Target field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.targetField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "targetField", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Max chars
              </label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.maxChars ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "maxChars", e.target.value)
                }
              />
            </div>
          </div>
        );
      case "LLM_SUMMARIZE":
        return (
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Input field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.inputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "inputField", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Output field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.outputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "outputField", e.target.value)
                }
              />
            </div>
          </div>
        );
      case "LLM_GENERAL":
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Prompt template
              </label>
              <textarea
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.promptTemplate ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "promptTemplate", e.target.value)
                }
              />
              <p className="mt-1 text-[10px] text-slate-500">
                You can reference context fields like {"{{pageContent}}"}.
              </p>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Output field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.outputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "outputField", e.target.value)
                }
              />
            </div>
          </div>
        );
      case "TRANSFORM_TEXT":
        return (
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Input field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.inputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "inputField", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Output field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.outputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "outputField", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Operation
              </label>
              <select
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.operation ?? "uppercase"}
                onChange={(e) =>
                  updateStepConfigField(index, "operation", e.target.value)
                }
              >
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="trim">Trim</option>
              </select>
            </div>
          </div>
        );
      case "ECHO":
      default:
        return (
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Message
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.message ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "message", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Output field
              </label>
              <input
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                value={c.outputField ?? ""}
                onChange={(e) =>
                  updateStepConfigField(index, "outputField", e.target.value)
                }
              />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Workflow Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Build, run, and experiment with AI-powered workflows using MERN +
            TypeScript + Hugging Face.
          </p>
        </header>

        {/* Create Workflow */}
        <section className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Create Workflow</h2>
              <p className="text-xs text-slate-400">
                Define steps, configs, and save a reusable workflow. The created
                workflow ID is auto-linked to the runner below.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateWorkflowSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Workflow name
                </label>
                <input
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <input
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                  value={wfDescription}
                  onChange={(e) => setWfDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Steps</h3>
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  + Add step
                </button>
              </div>

              <div className="space-y-3">
                {wfSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-300">
                        Step {index + 1} – {step.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                          value={step.type}
                          onChange={(e) =>
                            updateStepType(index, e.target.value as StepType)
                          }
                        >
                          <option value="FETCH_URL">FETCH_URL</option>
                          <option value="LLM_SUMMARIZE">LLM_SUMMARIZE</option>
                          <option value="LLM_GENERAL">LLM_GENERAL</option>
                          <option value="TRANSFORM_TEXT">TRANSFORM_TEXT</option>
                          <option value="ECHO">ECHO</option>
                        </select>
                        {wfSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-[11px] text-slate-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {renderStepConfigInputs(step, index)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={wfCreating || !wfName.trim() || wfSteps.length === 0}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {wfCreating ? "Creating..." : "Save Workflow"}
              </button>
              {wfCreated && (
                <div className="text-xs text-emerald-400">
                  Saved! ID:{" "}
                  <span className="font-mono">{wfCreated._id}</span> (linked
                  below)
                </div>
              )}
            </div>

            {wfCreateError && (
              <p className="text-xs text-red-400">{wfCreateError}</p>
            )}
          </form>
        </section>

        {/* Playground cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Test LLM card */}
          <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
            <h2 className="text-lg font-semibold mb-2">
              1. Test LLM (Text Generation)
            </h2>
            <p className="text-sm text-slate-400 mb-3">
              Sends your prompt to the Hugging Face Router using a chat model.
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

        {/* Workflow Runner */}
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-slate-950/40">
          <h2 className="text-lg font-semibold mb-2">3. Run Workflow</h2>
          <p className="text-sm text-slate-400 mb-3">
            Executes a saved workflow on the backend. Context JSON is passed as
            the initial data that flows through steps.
          </p>

          <form onSubmit={handleWorkflowRunSubmit} className="space-y-3">
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
                Example for URL workflow: {"{ \"url\": \"https://example.com\" }"}
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
