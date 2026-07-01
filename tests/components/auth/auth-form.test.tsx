import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AuthForm as AuthFormType } from "@/components/auth/auth-form";
import type { AuthActionState } from "@/actions/auth";

let AuthForm: typeof AuthFormType;

before(async () => {
  ({ AuthForm } = await import("@/components/auth/auth-form"));
});

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
}

describe("AuthForm", () => {
  afterEach(() => cleanup());

  it("renders labeled email and password fields with the submit label", () => {
    render(<AuthForm action={async () => ({})} submitLabel="Sign in" />);
    screen.getByLabelText("Email");
    screen.getByLabelText("Password");
    screen.getByRole("button", { name: "Sign in" });
  });

  it("uses new-password autocomplete when showConfirm is set", () => {
    render(
      <AuthForm action={async () => ({})} submitLabel="Create account" showConfirm />,
    );
    assert.equal(
      screen.getByLabelText("Password").getAttribute("autocomplete"),
      "new-password",
    );
  });

  it("shows the error message returned by the action", async () => {
    const action = async (): Promise<AuthActionState> => ({
      error: "Invalid credentials",
    });
    render(<AuthForm action={action} submitLabel="Sign in" />);
    fillCredentials("a@b.com", "password123");
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
    await screen.findByRole("alert");
    screen.getByText("Invalid credentials");
  });

  it("shows the success message returned by the action", async () => {
    const action = async (): Promise<AuthActionState> => ({
      message: "Check your email to confirm your account.",
    });
    render(<AuthForm action={action} submitLabel="Create account" showConfirm />);
    fillCredentials("a@b.com", "password123");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);
    await waitFor(() => screen.getByRole("status"));
    screen.getByText("Check your email to confirm your account.");
  });
});
