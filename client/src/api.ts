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

export async function callTestLlm(prompt: string): Promise<TestLlmResponse> {
  const res = await fetch("/api/test-llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Failed to call /api/test-llm");
  }

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

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Failed to call /api/summarize-url");
  }

  return res.json();
}

// Run workflow by ID with a context object
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

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Failed to run workflow");
  }

  return res.json();
}

export type { WorkflowRunResponse };




// export interface TestLlmResponse {
//   prompt: string;
//   result: string;
// }

// export interface SummarizeUrlResponse {
//   url: string;
//   summary: string;
// }

// export async function callTestLlm(prompt: stringa): Promise<TestLlmResponse> {
//   const res = await fetch("/api/test-llm", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ prompt }),
//   });

//   if (!res.ok) {
//     const errBody = await res.json().catch(() => ({}));
//     throw new Error(errBody.error || "Failed to call /api/test-llm");
//   }

//   return res.json();
// }

// export async function callSummarizeUrl(url: string): Promise<SummarizeUrlResponse> {
//   const res = await fetch("/api/summarize-url", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ url }),
//   });

//   if (!res.ok) {
//     const errBody = await res.json().catch(() => ({}));
//     throw new Error(errBody.error || "Failed to call /api/summarize-url");
//   }

//   return res.json();
// }
