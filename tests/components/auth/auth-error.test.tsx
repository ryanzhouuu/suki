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

  it("shows the mapped message for the oauth code", () => {
    render(<AuthErrorBanner code="oauth" />);
    screen.getByText("Could not start Google sign in. Please try again.");
    cleanup();
  });

  it("shows the mapped message for the google_secret code", () => {
    render(<AuthErrorBanner code="google_secret" />);
    screen.getByText(/Google sign in failed because the client secret/);
    cleanup();
  });
});
