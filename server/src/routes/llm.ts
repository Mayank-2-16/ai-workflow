import { Router, Request, Response } from "express";
import { generateText } from "../services/huggingface";

const router = Router();

// POST /api/test-llm
router.post("/test-llm", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required as string" });
    }

    const result = await generateText(prompt);
    res.json({ prompt, result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
