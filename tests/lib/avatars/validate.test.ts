import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  avatarObjectPath,
  validateAvatarFile,
} from "@/lib/avatars/validate";

describe("validateAvatarFile", () => {
  it("accepts a valid JPEG under the size limit", () => {
    assert.equal(
      validateAvatarFile({ size: 1024, type: "image/jpeg" }),
      null,
    );
  });

  it("rejects empty files", () => {
    assert.equal(
      validateAvatarFile({ size: 0, type: "image/jpeg" }),
      "Please choose an image.",
    );
  });

  it("rejects files over 2 MB", () => {
    assert.equal(
      validateAvatarFile({ size: 2 * 1024 * 1024 + 1, type: "image/png" }),
      "Image must be 2 MB or smaller.",
    );
  });

  it("rejects unsupported mime types", () => {
    assert.equal(
      validateAvatarFile({ size: 100, type: "image/svg+xml" }),
      "Use a JPEG, PNG, WebP, or GIF image.",
    );
  });
});

describe("avatarObjectPath", () => {
  it("builds a user-scoped storage path", () => {
    assert.equal(
      avatarObjectPath("user-123", "image/webp"),
      "user-123/avatar.webp",
    );
  });

  it("returns null for unsupported mime types", () => {
    assert.equal(avatarObjectPath("user-123", "image/svg+xml"), null);
  });
});
