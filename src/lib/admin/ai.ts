import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getEnv } from "@/src/config/env";
import { logger } from "@/src/lib/logger";

const Draft = z.object({
  name: z.string(),
  summary: z.string(),
  html: z.string(),
});
const languageName = {
  az: "Azerbaijani (Latin script)",
  ru: "Russian",
} as const;

/**
 * Admin-only helper: drafts a translation of an English product text with Claude.
 * The result is stored as `ai_draft` and must be approved by an admin before it counts as reviewed.
 * Returns null when no API key is configured or the model declines.
 */
export async function translateDraft(
  locale: "az" | "ru",
  source: { name: string; summary: string; html: string },
) {
  const env = getEnv();
  if (!env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const response = await client.beta.messages.parse({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 16000,
      output_config: { effort: "low", format: betaZodOutputFormat(Draft) },
      // Server-side fallback on refusals (see Claude API docs).
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system:
        "You translate B2B workwear product copy for an Azerbaijani manufacturer. Keep brand/model names, SKUs and standard codes (e.g. S3, EN ISO 20471) unchanged. Use natural industry terminology. Keep the HTML structure and tags exactly; translate only text nodes.",
      messages: [
        {
          role: "user",
          content: `Translate into ${languageName[locale]}.\n\nNAME:\n${source.name}\n\nSUMMARY:\n${source.summary}\n\nDESCRIPTION_HTML:\n${source.html}`,
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      logger.warn(
        { stop: response.stop_reason },
        "AI translation not produced",
      );
      return null;
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.APIError)
      logger.warn({ status: error.status }, "AI translation API error");
    else logger.warn({ err: String(error) }, "AI translation failed");
    return null;
  }
}
