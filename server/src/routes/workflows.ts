import { Router, Request, Response } from "express";
import { WorkflowModel } from "../models/workflow";
import { runWorkflow } from "../services/workflowRunner";

const router = Router();

// GET /api/workflows  (list all workflows – simple for now)
router.get("/workflows", async (_req: Request, res: Response) => {
  try {
    const workflows = await WorkflowModel.find().sort({ createdAt: -1 }).lean();
    res.json(workflows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to list workflows" });
  }
});

// POST /api/workflows  (create workflow from frontend)
router.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, description, trigger = "manual", steps } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return res
        .status(400)
        .json({ error: "steps must be a non-empty array" });
    }

    const workflow = await WorkflowModel.create({
      name,
      description,
      trigger,
      steps,
    });

    res.status(201).json(workflow);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to create workflow" });
  }
});

// OPTIONAL HELPER – create a sample workflow
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

// POST /api/workflows/:id/run  (run a workflow with initial context)
router.post("/workflows/:id/run", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const initialContext =
      req.body && typeof req.body === "object" ? req.body : {};

    const result = await runWorkflow(id, initialContext);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to run workflow" });
  }
});

export default router;
