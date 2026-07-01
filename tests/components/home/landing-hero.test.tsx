import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { LandingHero } from "@/components/home/landing-hero";

describe("LandingHero", () => {
  it("shows the headline and sign-in/create-account links", () => {
    // bgSrc left empty: HeroBackground's populated-src branch renders
    // next/image with a real URL, which next/image can only validate inside
    // the real build pipeline (see hero-background.test.tsx).
    render(<LandingHero bgSrc="" />);
    screen.getByText("Track anime with less friction");
    const createAccount = screen.getByRole("link", { name: "Create account" });
    assert.equal(createAccount.getAttribute("href"), "/auth/login?mode=signup");
    const signIn = screen.getByRole("link", { name: "Sign in" });
    assert.equal(signIn.getAttribute("href"), "/auth/login");
    cleanup();
  });
});
