import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { sanitizeExternalUrl } from "@/lib/security/url";

describe("sanitizeExternalUrl", () => {
  it("allows https URLs", () => {
    assert.equal(sanitizeExternalUrl("https://example.com/a"), "https://example.com/a");
  });
  it("allows http URLs", () => {
    assert.equal(sanitizeExternalUrl("http://example.com"), "http://example.com/");
  });
  it("rejects javascript:, data:, blob:, malformed, and empty", () => {
    assert.equal(sanitizeExternalUrl("javascript:alert(1)"), null);
    assert.equal(sanitizeExternalUrl("data:text/html,<script>1</script>"), null);
    assert.equal(sanitizeExternalUrl("blob:https://x"), null);
    assert.equal(sanitizeExternalUrl("not a url"), null);
    assert.equal(sanitizeExternalUrl(""), null);
    assert.equal(sanitizeExternalUrl(null), null);
    assert.equal(sanitizeExternalUrl(undefined), null);
  });
});
