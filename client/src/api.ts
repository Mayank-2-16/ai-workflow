export interface TestLlmResponse {
  prompt: string;
  result: string;
}

export interface SummarizeUrlResponse {
  url: string;
  summary: string;
}

export interface WorkflowRunStep {
  id: string;
  type: string;
  status: "success" | "error";
  error?: string;
}

export interface WorkflowRunResponse {
  workflowId: string;
  context: Record<string, any>;
  stepsRun: WorkflowRunStep[];
}

export type StepType =
  | "FETCH_URL"
  | "LLM_SUMMARIZE"
  | "LLM_GENERAL"
  | "TRANSFORM_TEXT"
  | "ECHO";

export interface StepInput {
  id: string;
  type: StepType;
  order: number;
  config: Record<string, any>;
}

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  trigger: "manual" | "schedule";
  steps: StepInput[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  trigger?: "manual" | "schedule";
  steps: StepInput[];
}

export async function callTestLlm(prompt: string): Promise<TestLlmResponse> {
  const res = await fetch("/api/test-llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error("Failed to call /api/test-llm");
  return res.json();
}

export async function callSummarizeUrl(
  url: string
): Promise<SummarizeUrlResponse> {
  const res = await fetch("/api/summarize-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) throw new Error("Failed to call /api/summarize-url");
  return res.json();
}

export async function callRunWorkflow(
  workflowId: string,
  context: Record<string, any>
): Promise<WorkflowRunResponse> {
  const res = await fetch(`/api/workflows/${workflowId}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(context),
  });

  if (!res.ok) throw new Error("Failed to run workflow");
  return res.json();
}

export async function createWorkflow(
  data: CreateWorkflowInput
): Promise<Workflow> {
  const res = await fetch("/api/workflows", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Failed to create workflow");
  }

  return res.json();
}

export async function listWorkflows(): Promise<Workflow[]> {
  const res = await fetch("/api/workflows");
  if (!res.ok) throw new Error("Failed to list workflows");
  return res.json();
}
