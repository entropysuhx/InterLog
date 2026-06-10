import { env } from "@/env";

export class AIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  if (!env.DEEPSEEK_API_KEY) throw new AIError("DeepSeek is not configured.");
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.2,
      messages,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new AIError("DeepSeek request failed.", response.status);
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new AIError("DeepSeek returned an empty response.");
  return content;
}

