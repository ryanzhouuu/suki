import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { OAuthButtons as OAuthButtonsType } from "@/components/auth/oauth-buttons";

mock.module("@/actions/auth", {
  namedExports: {
    signInWithGoogle: async () => {},
  },
});

let OAuthButtons: typeof OAuthButtonsType;

before(async () => {
  ({ OAuthButtons } = await import("@/components/auth/oauth-buttons"));
});

describe("OAuthButtons", () => {
  it("renders a 'Continue with Google' submit button inside a form", () => {
    render(<OAuthButtons />);
    const button = screen.getByRole("button", { name: /Continue with Google/ });
    assert.ok(button.closest("form"));
    cleanup();
  });

  it("shows the 'or' divider", () => {
    render(<OAuthButtons />);
    screen.getByText("or");
    cleanup();
  });
});
