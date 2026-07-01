import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { AuthErrorBanner } from "@/components/auth/auth-error";

describe("AuthErrorBanner", () => {
  it("renders nothing when there's no code", () => {
    const { container } = render(<AuthErrorBanner />);
    assert.equal(container.firstChild, null);
    cleanup();
  });

  it("shows the mapped message for a known code", () => {
    render(<AuthErrorBanner code="pkce" />);
    screen.getByRole("alert");
    screen.getByText(/Sign in session expired before callback/);
    cleanup();
  });

  it("falls back to the generic auth message for an unknown code", () => {
    render(<AuthErrorBanner code="something_unexpected" />);
    screen.getByText("Sign in failed. Please try again.");
    cleanup();
  });

  it("shows the description only alongside the 'auth' code", () => {
    render(<AuthErrorBanner code="auth" description="Extra context" />);
    screen.getByText("Extra context");
    cleanup();
  });

  it("hides the description for non-'auth' codes", () => {
    render(<AuthErrorBanner code="oauth" description="Extra context" />);
    assert.equal(screen.queryByText("Extra context"), null);
    cleanup();
  });
});
