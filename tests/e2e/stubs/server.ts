import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { handleAnilistGraphql } from "./anilist";
import { handleOpenAiEmbeddings } from "./openai";

export const E2E_STUB_HOST = "127.0.0.1";
export const E2E_STUB_PORT = 4100;

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("request body must be valid JSON");
  }
}

export function createProviderStubServer() {
  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      json(response, 200, { ok: true });
      return;
    }

    if (request.method !== "POST") {
      json(response, 404, { error: { message: "unknown E2E stub path" } });
      return;
    }

    let body: unknown;
    try {
      body = await readJson(request);
    } catch (error) {
      json(response, 400, {
        error: { message: error instanceof Error ? error.message : "invalid request" },
      });
      return;
    }

    try {
      if (request.url === "/anilist/graphql") {
        const result = handleAnilistGraphql(body as Parameters<typeof handleAnilistGraphql>[0]);
        json(response, result.status, result.status === 200 ? { data: result.body } : result.body);
        return;
      }

      if (request.url === "/openai/v1/embeddings") {
        const result = handleOpenAiEmbeddings(body);
        json(response, result.status, result.body);
        return;
      }

      json(response, 404, { error: { message: "unknown E2E stub path" } });
    } catch (error) {
      json(response, 500, {
        error: {
          message: error instanceof Error ? `E2E stub error: ${error.message}` : "E2E stub error",
        },
      });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createProviderStubServer();
  server.listen(E2E_STUB_PORT, E2E_STUB_HOST, () => {
    console.log(`E2E provider stub listening on http://${E2E_STUB_HOST}:${E2E_STUB_PORT}`);
  });
}
