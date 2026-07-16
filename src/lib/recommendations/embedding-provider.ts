import OpenAI from "openai";

import { env } from "@/lib/env";

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./constants";
import type { EmbeddingProvider } from "./types";

const BATCH_SIZE = 64;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; code?: string };
  return e.status === 429 && e.code === "insufficient_quota";
}

export function formatEmbeddingError(error: unknown): string {
  if (isQuotaError(error)) {
    return (
      "OpenAI returned insufficient_quota: your API key has no remaining credits. " +
      "Add billing at https://platform.openai.com/account/billing or use a different key."
    );
  }
  if (error instanceof Error) return error.message;
  return "Embedding request failed";
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(env.openAiApiKey());
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const apiKey = env.openAiApiKey();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable recommendations.",
    );
  }

  const baseURL = env.openAiBaseUrl();
  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    async embed(inputs: string[]) {
      if (inputs.length === 0) return [];

      const results: number[][] = [];

      for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
        const batch = inputs.slice(i, i + BATCH_SIZE);
        let lastError: unknown;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const response = await client.embeddings.create({
              model: EMBEDDING_MODEL,
              input: batch,
              dimensions: EMBEDDING_DIMENSIONS,
            });

            for (const item of response.data) {
              results[item.index + i] = item.embedding;
            }
            break;
          } catch (error) {
            lastError = error;
            if (isQuotaError(error)) throw error;
            if (attempt < MAX_RETRIES - 1) {
              await sleep(250 * 2 ** attempt);
            }
          }
        }

        if (results.length <= i) {
          throw lastError instanceof Error
            ? lastError
            : new Error("Embedding request failed");
        }
      }

      return results;
    },
  };
}
