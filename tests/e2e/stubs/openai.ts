import { createHash } from "node:crypto";

export type OpenAiStubResponse = {
  status: number;
  body: Record<string, unknown>;
};

function vectorFor(input: string, dimensions: number): number[] {
  const vector = Array.from({ length: dimensions }, (_, index) => {
    const digest = createHash("sha256")
      .update(`${input}\u0000${index}`)
      .digest();
    return digest[0] / 127.5 - 1;
  });
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return vector.map((value) => value / norm);
}

export function handleOpenAiEmbeddings(
  request: unknown,
): OpenAiStubResponse {
  if (!request || typeof request !== "object") {
    return { status: 400, body: { error: { message: "JSON object required" } } };
  }

  const payload = request as Record<string, unknown>;
  const rawInput = payload.input;
  const inputs = typeof rawInput === "string"
    ? [rawInput]
    : Array.isArray(rawInput) && rawInput.every((value) => typeof value === "string")
      ? rawInput
      : null;
  const dimensions = payload.dimensions;

  if (!inputs || !Number.isInteger(dimensions) || Number(dimensions) <= 0) {
    return {
      status: 400,
      body: { error: { message: "input and positive integer dimensions are required" } },
    };
  }

  return {
    status: 200,
    body: {
      object: "list",
      model: typeof payload.model === "string" ? payload.model : "text-embedding-3-small",
      data: inputs.map((input, index) => ({
        object: "embedding",
        index,
        embedding: vectorFor(input, Number(dimensions)),
      })),
      usage: { prompt_tokens: 0, total_tokens: 0 },
    },
  };
}
