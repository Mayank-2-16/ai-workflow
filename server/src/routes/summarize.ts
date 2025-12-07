import { Router, Request, Response } from "express";
import { summarizeText } from "../services/huggingface";

const router = Router();

// Very basic HTML → text extraction
function stripHtml(html: string): string {
  // remove script & style tags
  const withoutScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                             .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // strip remaining tags
  const withoutTags = withoutScripts.replace(/<\/?[^>]+(>|$)/g, " ");
  // collapse whitespace
  return withoutTags.replace(/\s+/g, " ").trim();
}

// POST /api/summarize-url
router.post("/summarize-url", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required as string" });
    }

    const pageResponse = await fetch(url);
    if (!pageResponse.ok) {
      return res.status(400).json({ error: "Failed to fetch URL" });
    }

    const html = await pageResponse.text();
    const text = stripHtml(html);

    // limit text length to avoid token overload
    const maxChars = 6000;
    const trimmedText = text.slice(0, maxChars);

    const summary = await summarizeText(trimmedText);

    res.json({
      url,
      summary,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
