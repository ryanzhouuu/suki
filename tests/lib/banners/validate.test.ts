import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bannerObjectPath,
  validateBannerFile,
} from "@/lib/banners/validate";

describe("validateBannerFile", () => {
  it("rejects empty files", () => {
    assert.match(
      validateBannerFile({ size: 0, type: "image/jpeg" }) ?? "",
      /choose/i,
    );
  });

  it("rejects oversized files", () => {
    const error = validateBannerFile({
      size: 6 * 1024 * 1024,
      type: "image/jpeg",
    });
    assert.match(error ?? "", /5 MB/i);
  });

  it("rejects unsupported mime types", () => {
    const error = validateBannerFile({
      size: 1000,
      type: "image/gif",
    });
    assert.match(error ?? "", /JPEG/i);
  });
});

describe("bannerObjectPath", () => {
  it("returns a path with extension", () => {
    assert.equal(
      bannerObjectPath("user-123", "image/webp"),
      "user-123/banner.webp",
    );
  });

  it("returns null for unsupported types", () => {
    assert.equal(bannerObjectPath("user-123", "image/gif"), null);
  });
});
