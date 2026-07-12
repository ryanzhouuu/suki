import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RecommendationPreferencesForm as RecommendationPreferencesFormType } from "@/components/recommendations/recommendation-preferences-form";
import type { RecommendationsActionState } from "@/actions/recommendations";

const refreshCalls: FormData[] = [];
let refreshResult: RecommendationsActionState = {};

mock.module("@/actions/recommendations", {
  namedExports: {
    refreshRecommendations: async (
      _prev: RecommendationsActionState,
      formData: FormData,
    ) => {
      refreshCalls.push(formData);
      return refreshResult;
    },
  },
});

let RecommendationPreferencesForm: typeof RecommendationPreferencesFormType;

before(async () => {
  ({ RecommendationPreferencesForm } = await import(
    "@/components/recommendations/recommendation-preferences-form"
  ));
});

describe("RecommendationPreferencesForm", () => {
  afterEach(() => {
    cleanup();
    refreshCalls.length = 0;
    refreshResult = {};
  });

  it("renders the title when provided", () => {
    render(<RecommendationPreferencesForm title="Find your next watch" />);
    screen.getByRole("heading", { name: "Find your next watch" });
  });

  it("omits the optional title heading when not provided", () => {
    render(<RecommendationPreferencesForm />);
    // The static "What do you want next?" h2 always renders; only the
    // optional title prop's h1 should be absent.
    assert.equal(screen.queryAllByRole("heading").length, 1);
  });

  it("toggles a mood preset chip on and off", () => {
    render(<RecommendationPreferencesForm />);
    const cozy = screen.getByRole("button", { name: "cozy" });
    assert.equal(cozy.getAttribute("aria-pressed"), "false");
    fireEvent.click(cozy);
    assert.equal(cozy.getAttribute("aria-pressed"), "true");
    fireEvent.click(cozy);
    assert.equal(cozy.getAttribute("aria-pressed"), "false");
  });

  it("disables mood preset chips once free-text mood is entered", () => {
    render(<RecommendationPreferencesForm />);
    fireEvent.change(screen.getByLabelText("Mood"), {
      target: { value: "something specific" },
    });
    const cozy = screen.getByRole("button", { name: "cozy" });
    assert.equal(cozy.hasAttribute("disabled"), true);
  });

  it("selects an adventurousness level", () => {
    render(<RecommendationPreferencesForm />);
    const adventurous = screen.getByRole("button", { name: "Adventurous" });
    fireEvent.click(adventurous);
    assert.equal(adventurous.getAttribute("aria-pressed"), "true");
    assert.equal(
      screen.getByRole("button", { name: "Balanced" }).getAttribute("aria-pressed"),
      "false",
    );
  });

  it("submits selected genres, mood, and adventurousness", async () => {
    render(<RecommendationPreferencesForm />);
    fireEvent.click(screen.getByRole("button", { name: /^Genres/ }));
    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    fireEvent.click(screen.getByRole("button", { name: "hype" }));
    fireEvent.click(screen.getByRole("button", { name: "Adventurous" }));
    fireEvent.click(screen.getByRole("button", { name: "Get recommendations" }));

    await waitFor(() => assert.equal(refreshCalls.length, 1));
    const formData = refreshCalls[0];
    assert.equal(formData.get("genre"), "Action");
    assert.equal(formData.get("moodPreset"), "hype");
    assert.equal(formData.get("adventurousness"), "adventurous");
  });

  it("shows the error returned by the action", async () => {
    refreshResult = { error: "Could not refresh", referenceId: "abc12345" };
    render(<RecommendationPreferencesForm />);
    fireEvent.click(screen.getByRole("button", { name: "Get recommendations" }));
    await screen.findByRole("alert");
    screen.getByText("Could not refresh");
    screen.getByText("Reference: abc12345");
  });
});
