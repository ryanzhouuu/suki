import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CollaborativeRecommendationPreferencesForm as CollaborativeRecommendationPreferencesFormType } from "@/components/recommendations/collaborative-recommendation-preferences-form";
import type { RecommendationsActionState } from "@/actions/recommendations";

const refreshCalls: FormData[] = [];
let refreshResult: RecommendationsActionState = {};

mock.module("@/actions/recommendations", {
  namedExports: {
    refreshCollaborativeRecommendations: async (
      _prev: RecommendationsActionState,
      formData: FormData,
    ) => {
      refreshCalls.push(formData);
      return refreshResult;
    },
  },
});

let CollaborativeRecommendationPreferencesForm: typeof CollaborativeRecommendationPreferencesFormType;

before(async () => {
  ({ CollaborativeRecommendationPreferencesForm } = await import(
    "@/components/recommendations/collaborative-recommendation-preferences-form"
  ));
});

describe("CollaborativeRecommendationPreferencesForm", () => {
  afterEach(() => {
    cleanup();
    refreshCalls.length = 0;
    refreshResult = {};
  });

  it("shows the initial mode's label", () => {
    render(
      <CollaborativeRecommendationPreferencesForm
        friendUserId="u2"
        friendUsername="bob"
        initialMode="short_watch"
      />,
    );
    screen.getByText("Short watch");
  });

  it("changes mode via the InlineSelect and includes it on submit", async () => {
    render(
      <CollaborativeRecommendationPreferencesForm
        friendUserId="u2"
        friendUsername="bob"
        initialMode="best_shared_match"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mode" }));
    fireEvent.click(screen.getByRole("option", { name: "Surprise us" }));
    screen.getByText("Surprise us");

    fireEvent.click(screen.getByRole("button", { name: "Get shared recommendations" }));
    await waitFor(() => assert.equal(refreshCalls.length, 1));
    const formData = refreshCalls[0];
    assert.equal(formData.get("friendUserId"), "u2");
    assert.equal(formData.get("friendUsername"), "bob");
    assert.equal(formData.get("collaborationMode"), "surprise_us");
  });

  it("includes selected genres on submit", async () => {
    render(
      <CollaborativeRecommendationPreferencesForm
        friendUserId="u2"
        friendUsername="bob"
        initialMode="best_shared_match"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Genres/ }));
    fireEvent.click(screen.getByRole("button", { name: "Comedy" }));
    fireEvent.click(screen.getByRole("button", { name: "Get shared recommendations" }));
    await waitFor(() => assert.equal(refreshCalls.length, 1));
    assert.equal(refreshCalls[0].get("genre"), "Comedy");
  });

  it("shows the error returned by the action", async () => {
    refreshResult = { error: "Could not refresh" };
    render(
      <CollaborativeRecommendationPreferencesForm
        friendUserId="u2"
        friendUsername="bob"
        initialMode="best_shared_match"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Get shared recommendations" }));
    await screen.findByRole("alert");
    screen.getByText("Could not refresh");
  });
});
