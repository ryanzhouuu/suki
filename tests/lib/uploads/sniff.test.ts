import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sniffImageMime } from "@/lib/uploads/sniff";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function ascii(text: string): number[] {
  return Array.from(text).map((char) => char.charCodeAt(0));
}

describe("sniffImageMime", () => {
  it("detects a JPEG by its ff d8 ff signature", () => {
    assert.equal(
      sniffImageMime(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10)),
      "image/jpeg",
    );
  });

  it("detects a PNG by its 8-byte signature", () => {
    assert.equal(
      sniffImageMime(
        bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00),
      ),
      "image/png",
    );
  });

  it("detects a GIF87a file", () => {
    assert.equal(
      sniffImageMime(new Uint8Array(ascii("GIF87a").concat([0x00, 0x00]))),
      "image/gif",
    );
  });

  it("detects a GIF89a file", () => {
    assert.equal(
      sniffImageMime(new Uint8Array(ascii("GIF89a").concat([0x00, 0x00]))),
      "image/gif",
    );
  });

  it("detects a WebP file via the RIFF????WEBP signature", () => {
    const riffBytes = new Uint8Array(
      ascii("RIFF").concat([0x00, 0x00, 0x00, 0x00]).concat(ascii("WEBP")),
    );
    assert.equal(sniffImageMime(riffBytes), "image/webp");
  });

  it("rejects an empty array", () => {
    assert.equal(sniffImageMime(new Uint8Array()), null);
  });

  it("rejects plain text bytes", () => {
    assert.equal(sniffImageMime(new Uint8Array(ascii("hello world"))), null);
  });

  it("rejects a truncated PNG signature", () => {
    assert.equal(
      sniffImageMime(bytes(0x89, 0x50, 0x4e, 0x47)),
      null,
    );
  });

  it("rejects a RIFF container without a WEBP tag", () => {
    const riffBytes = new Uint8Array(
      ascii("RIFF").concat([0x00, 0x00, 0x00, 0x00]).concat(ascii("AVI ")),
    );
    assert.equal(sniffImageMime(riffBytes), null);
  });
});
