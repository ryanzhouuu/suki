import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { handleAnilistGraphql } from "./anilist";
import { handleOpenAiEmbeddings } from "./openai";

describe("AniList E2E stub", () => {
  it("returns named search fixtures without remote image URLs", () => {
    const result = handleAnilistGraphql({
      query: "query SearchAnime($search: String) { Page { media { id } } }",
      variables: { search: "Moonlit" },
    });

    assert.equal(result.status, 200);
    const media = (result.body.Page as { media: Array<{ id: number; coverImage: { large: string | null } }> }).media;
    assert.deepEqual(media.map((item) => item.id), [1001, 1002]);
    assert.equal(media[0].coverImage.large, null);
  });

  it("returns detail and relation data by stable id", () => {
    const result = handleAnilistGraphql({
      query: "query AnimeDetail($id: Int) { Media(id: $id) { id relations { edges { node { id } } } } }",
      variables: { id: 1002 },
    });
    const media = result.body.Media as { id: number; relations: { edges: Array<{ node: { id: number } }> } };
    assert.equal(media.id, 1002);
    assert.deepEqual(media.relations.edges.map((edge) => edge.node.id), [1001]);
  });

  it("fails clearly for unknown operations", () => {
    assert.throws(
      () => handleAnilistGraphql({ query: "query Unsupported { Viewer { id } }" }),
      /Unknown AniList operation: Unsupported/,
    );
  });
});

describe("OpenAI E2E stub", () => {
  it("returns normalized deterministic vectors in input order", () => {
    const request = {
      model: "text-embedding-3-small",
      input: ["first title", "second title"],
      dimensions: 8,
    };
    const first = handleOpenAiEmbeddings(request);
    const second = handleOpenAiEmbeddings(request);
    assert.equal(first.status, 200);
    assert.deepEqual(first.body, second.body);

    const data = first.body.data as Array<{ index: number; embedding: number[] }>;
    assert.deepEqual(data.map((item) => item.index), [0, 1]);
    assert.equal(data[0].embedding.length, 8);
    assert.ok(Math.abs(Math.hypot(...data[0].embedding) - 1) < 1e-9);
  });

  it("rejects malformed embedding requests", () => {
    const result = handleOpenAiEmbeddings({ input: ["title"] });
    assert.equal(result.status, 400);
    assert.match(
      String((result.body.error as { message: string }).message),
      /dimensions/,
    );
  });
});
