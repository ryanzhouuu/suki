import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AuthPanel as AuthPanelType } from "@/components/auth/auth-panel";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

mock.module("@/actions/auth", {
  namedExports: {
    signIn: async () => ({}),
    signUp: async () => ({}),
    signInWithGoogle: async () => {},
  },
});

let AuthPanel: typeof AuthPanelType;

before(async () => {
  ({ AuthPanel } = await import("@/components/auth/auth-panel"));
});

describe("AuthPanel", () => {
  afterEach(() => {
    cleanup();
    router.replace = () => {};
  });

  it("shows sign-in copy and a 'Sign in' submit button by default", () => {
    render(<AuthPanel initialMode="signin" />);
    screen.getByText("Welcome back");
    screen.getByRole("heading", { name: "Sign in" });
    // The mode toggle and the form's submit button are both labeled "Sign in".
    assert.equal(screen.getAllByRole("button", { name: "Sign in" }).length, 2);
  });

  it("shows sign-up copy and a confirm-password autocomplete when initialMode is signup", () => {
    render(<AuthPanel initialMode="signup" />);
    screen.getByText("Start tracking");
    screen.getByRole("heading", { name: "Create account" });
    assert.equal(
      screen.getByLabelText("Password").getAttribute("autocomplete"),
      "new-password",
    );
  });

  it("switches mode and updates the URL when the toggle is clicked", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<AuthPanel initialMode="signin" />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    screen.getByRole("heading", { name: "Create account" });
    assert.equal(replaced, "/auth/login?mode=signup");
  });

  it("switches back to signin and clears the mode param", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<AuthPanel initialMode="signup" />);
    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
    assert.equal(replaced, "/auth/login");
  });

  it("shows the error banner when an error prop is provided", () => {
    render(<AuthPanel initialMode="signin" error="pkce" />);
    screen.getByText(/Sign in session expired before callback/);
  });
});
