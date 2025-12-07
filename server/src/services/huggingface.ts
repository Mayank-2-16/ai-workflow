import { env } from "../config/env";

// OpenAI-compatible chat completion endpoint for HF Router
const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

// We'll use a small-ish general model via HF Inference provider
// You can change this later if you want.
const DEFAULT_MODEL = "meta-llama/Llama-3.2-3B-Instruct";

async function hfChatRequest(
  userMessage: string,
  systemMessage?: string,
  options?: { maxTokens?: number }
): Promise<string> {
  if (!env.hfApiToken) {
    throw new Error("HF_API_TOKEN is missing");
  }

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      ...(systemMessage
        ? [{ role: "system", content: systemMessage }]
        : []),
      { role: "user", content: userMessage },
    ],
    max_tokens: options?.maxTokens ?? 256,
  };

  const response = await fetch(HF_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.hfApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("HuggingFace error:", errorText);
    throw new Error(
      `HuggingFace API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // OpenAI-style shape:
  // { choices: [ { message: { content: "..."} } ] }
  const content =
    data?.choices?.[0]?.message?.content ??
    JSON.stringify(data);

  return content as string;
}

// For /api/test-llm
export async function generateText(prompt: string): Promise<string> {
  // Simple direct chat with the model
  return hfChatRequest(prompt, "You are a helpful assistant.");
}

// For summarizing large text blocks
export async function summarizeText(text: string): Promise<string> {
  const systemMessage =
    "You are a concise summarization assistant. " +
    "Given a long text, you produce a clear summary in 3–5 bullet points.";

  const userMessage = `Summarize the following text:\n\n${text}`;

  return hfChatRequest(userMessage, systemMessage, { maxTokens: 256 });
}