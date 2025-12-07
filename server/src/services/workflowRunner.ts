import { WorkflowModel, Step, StepType } from "../models/workflow";
import { summarizeText, generateText } from "./huggingface";

// The "context" is what flows between steps.
export type WorkflowContext = Record<string, any>;

export interface StepRunResult {
  id: string;
  type: StepType;
  status: "success" | "error";
  error?: string;
}

export interface WorkflowRunResult {
  workflowId: string;
  context: WorkflowContext;
  stepsRun: StepRunResult[];
}

// Utility: strip HTML tags (similar to what we had in summarize route)
function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  const withoutTags = withoutScripts.replace(/<\/?[^>]+(>|$)/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

// Utility: very simple template rendering for LLM_GENERAL
// e.g. "Summarize: {{pageContent}}" will inject from context.pageContent
function renderTemplate(template: string, context: WorkflowContext): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}

async function executeStep(
  step: Step,
  context: WorkflowContext
): Promise<WorkflowContext> {
  const newContext = { ...context };
  const cfg = step.config || {};

  switch (step.type) {
    case "FETCH_URL": {
      const sourceField: string = cfg.sourceField || "url";
      const targetField: string = cfg.targetField || "pageContent";

      const url = newContext[sourceField] || cfg.url;
      if (!url || typeof url !== "string") {
        throw new Error(`FETCH_URL: No valid URL found in field "${sourceField}"`);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FETCH_URL: Failed to fetch URL (${response.status})`);
      }

      const html = await response.text();
      const text = stripHtml(html);
      const maxChars = cfg.maxChars ?? 6000;
      newContext[targetField] = text.slice(0, maxChars);
      return newContext;
    }

    case "LLM_SUMMARIZE": {
      const inputField: string = cfg.inputField || "pageContent";
      const outputField: string = cfg.outputField || "summary";

      const inputText = newContext[inputField];
      if (!inputText || typeof inputText !== "string") {
        throw new Error(
          `LLM_SUMMARIZE: No valid text found in field "${inputField}"`
        );
      }

      const summary = await summarizeText(inputText);
      newContext[outputField] = summary;
      return newContext;
    }

    case "LLM_GENERAL": {
      const promptTemplate: string = cfg.promptTemplate;
      const outputField: string = cfg.outputField || "llmResult";

      if (!promptTemplate || typeof promptTemplate !== "string") {
        throw new Error("LLM_GENERAL: promptTemplate is required");
      }

      const prompt = renderTemplate(promptTemplate, newContext);
      const result = await generateText(prompt);
      newContext[outputField] = result;
      return newContext;
    }

    case "TRANSFORM_TEXT": {
      const inputField: string = cfg.inputField || "text";
      const outputField: string = cfg.outputField || inputField;
      const operation: string = cfg.operation || "uppercase";

      const value = newContext[inputField];
      if (typeof value !== "string") {
        throw new Error(
          `TRANSFORM_TEXT: field "${inputField}" must be a string`
        );
      }

      let transformed = value;
      if (operation === "uppercase") {
        transformed = value.toUpperCase();
      } else if (operation === "lowercase") {
        transformed = value.toLowerCase();
      } else if (operation === "trim") {
        transformed = value.trim();
      }

      newContext[outputField] = transformed;
      return newContext;
    }

    case "ECHO": {
      const message: string = cfg.message || "Echo step ran.";
      const outputField: string = cfg.outputField || "echo";
      newContext[outputField] = message;
      return newContext;
    }

    default:
      throw new Error(`Unknown step type: ${(step as any).type}`);
  }
}

export async function runWorkflow(
  workflowId: string,
  initialContext: WorkflowContext = {}
): Promise<WorkflowRunResult> {
  const workflow = await WorkflowModel.findById(workflowId);
  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // sort by order to make sure steps run in correct sequence
  const steps = [...workflow.steps].sort((a, b) => a.order - b.order);

  let context: WorkflowContext = { ...initialContext };
  const stepsRun: StepRunResult[] = [];

  for (const step of steps) {
    try {
      context = await executeStep(step, context);
      stepsRun.push({
        id: step.id,
        type: step.type,
        status: "success",
      });
    } catch (err: any) {
      stepsRun.push({
        id: step.id,
        type: step.type,
        status: "error",
        error: err.message || String(err),
      });
      // stop execution on first error
      break;
    }
  }

  return {
    workflowId: workflow._id.toString(),
    context,
    stepsRun,
  };
}
