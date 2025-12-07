import { Router, Request, Response } from "express";
import { WorkflowModel } from "../models/workflow";
import { runWorkflow } from "../services/workflowRunner";

const router = Router();

// Create a sample workflow (optional helper)
router.post("/workflows/sample", async (_req: Request, res: Response) => {
  try {
    const workflow = await WorkflowModel.create({
      name: "Sample: Summarize URL",
      description: "Fetch a URL and summarize its content using LLM.",
      trigger: "manual",
      steps: [
        {
          id: "step1",
          type: "FETCH_URL",
          order: 1,
          config: { sourceField: "url", targetField: "pageContent" },
        },
        {
          id: "step2",
          type: "LLM_SUMMARIZE",
          order: 2,
          config: {
            inputField: "pageContent",
            outputField: "summary",
          },
        },
      ],
    });

    res.json(workflow);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to create sample workflow" });
  }
});

// Run a workflow by ID
// POST /api/workflows/:id/run
// Body will be used as initial context
router.post("/workflows/:id/run", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const initialContext = (req.body && typeof req.body === "object")
      ? req.body
      : {};

    const result = await runWorkflow(id, initialContext);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to run workflow" });
  }
});

export default router;
