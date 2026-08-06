import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { TasteFingerprintSection } from "@/components/profile/taste-fingerprint-section";

type TestFingerprint = NonNullable<
  ComponentProps<typeof TasteFingerprintSection>["fingerprint"]
>;
type TestFingerprintWithFormingReason = TestFingerprint & {
  formingReason?: "ranking" | "library";
};

function makeFingerprint(
  overrides: Partial<TestFingerprintWithFormingReason> = {},
): TestFingerprint {
  return {
    version: "fingerprint_v1",
    inputHash: "hash-1",
    state: "ready",
    sourceSeriesCount: 14,
    traits: [
      {
        id: "battle-tested-favorites",
        family: "ranking",
        label: "Battle-Tested Favorites",
        summary: "You know which favorites are worth defending.",
        strength: 0.94,
        evidence: [
          { kind: "ranked_count", text: "12 franchises are in your ranking." },
          { kind: "confidence", text: "8 of those rankings have medium or high confidence." },
        ],
      },
      {
        id: "movie-night-regular",
        family: "format",
        label: "Movie Night Regular",
        summary: "Feature-length stories have a regular place in your rotation.",
        strength: 0.8,
        evidence: [
          { kind: "movie_count", text: "4 movie franchises are completed." },
          { kind: "movie_share", text: "Movies make up 40% of known completed formats." },
        ],
      },
      {
        id: "rewatch-ritualist",
        family: "behavior",
        label: "Rewatch Ritualist",
        summary: "Some stories earn a return visit.",
        strength: 0.7,
        evidence: [
          { kind: "rewatch_count", text: "You have logged 5 rewatches." },
          { kind: "rewatch_series", text: "Those rewatches span 3 franchises." },
        ],
      },
      {
        id: "eclectic-explorer",
        family: "breadth",
        label: "Eclectic Explorer",
        summary: "Your watchlist keeps several doors open.",
        strength: 0.65,
        evidence: [
          { kind: "genre_breadth", text: "Your completed history spans 7 genres." },
          { kind: "genre_balance", text: "No single genre accounts for most of your activity." },
        ],
      },
      {
        id: "reserved-applause",
        family: "rating",
        label: "Reserved Applause",
        summary: "Your praise is earned, not automatic.",
        strength: 0.6,
        evidence: [
          { kind: "score_mean", text: "Your average personal score is 6.4 out of 10." },
          { kind: "score_count", text: "You have scored 10 franchises." },
        ],
      },
    ],
    ...overrides,
  } as TestFingerprint;
}

const baseProps = {
  isOwnProfile: false,
};

describe("TasteFingerprintSection", () => {
  afterEach(() => cleanup());

  it("renders the strongest trait first and keeps evidence in native disclosures", () => {
    render(
      <TasteFingerprintSection
        {...baseProps}
        fingerprint={makeFingerprint()}
        tracker={<span data-testid="tracker">tracker slot</span>}
      />,
    );

    const section = screen.getByRole("region", { name: "Taste fingerprint" });
    const headings = screen.getAllByRole("heading", { level: 3 });

    assert.deepEqual(
      headings.map((heading) => heading.textContent),
      [
        "Battle-Tested Favorites",
        "Movie Night Regular",
        "Rewatch Ritualist",
        "Eclectic Explorer",
        "Reserved Applause",
      ],
    );
    assert.match(headings[0].closest("li")?.className ?? "", /sm:col-span-2/);
    assert.equal(section.getAttribute("data-profile-user-id"), null);
    screen.getByTestId("tracker");

    const disclosures = section.querySelectorAll("details");
    assert.equal(disclosures.length, 5);
    assert.equal(
      disclosures[0].querySelector("summary")?.textContent?.includes("Why this fits"),
      true,
    );
    assert.equal(
      disclosures[0].querySelector("summary")?.getAttribute("aria-label"),
      "Why this fits Battle-Tested Favorites",
    );
    assert.match(
      disclosures[0].querySelector("summary")?.className ?? "",
      /motion-reduce:transition-none/,
    );
    fireEvent.click(disclosures[0].querySelector("summary")!);
    screen.getByText("12 franchises are in your ranking.");
  });

  it("renders one qualifying trait without filling the constellation", () => {
    const fingerprint = makeFingerprint();
    render(
      <TasteFingerprintSection
        {...baseProps}
        fingerprint={{ ...fingerprint, traits: [fingerprint.traits[0]] }}
      />,
    );

    assert.equal(screen.getAllByRole("heading", { level: 3 }).length, 1);
    screen.getByRole("heading", { name: "Battle-Tested Favorites" });
  });

  it("offers owners a ranking CTA when the fingerprint is forming from ranking data", () => {
    render(
      <TasteFingerprintSection
        {...baseProps}
        isOwnProfile
        fingerprint={makeFingerprint({ state: "forming", formingReason: "ranking" })}
      />,
    );

    const cta = screen.getByRole("link", { name: /rank more favorites/i });
    assert.equal(cta.getAttribute("href"), "/ranking");
  });

  it("offers owners a library CTA for a library-shaped forming state", () => {
    render(
      <TasteFingerprintSection
        {...baseProps}
        isOwnProfile
        fingerprint={makeFingerprint({ state: "forming", formingReason: "library" })}
      />,
    );

    const cta = screen.getByRole("link", { name: /add library activity/i });
    assert.equal(cta.getAttribute("href"), "/library");
  });

  it("keeps the forming state quiet for visitors", () => {
    render(
      <TasteFingerprintSection
        {...baseProps}
        fingerprint={makeFingerprint({ state: "forming", formingReason: "ranking" })}
      />,
    );

    screen.getByText("This fingerprint is still forming.");
    assert.equal(screen.queryByRole("link"), null);
  });

  it("treats null as unavailable without presenting a sparse-data CTA", () => {
    render(
      <TasteFingerprintSection
        {...baseProps}
        fingerprint={null}
        isOwnProfile
      />,
    );

    screen.getByText("Temporarily unavailable");
    assert.equal(screen.queryByRole("link"), null);
    assert.equal(screen.getByRole("region").getAttribute("data-state"), "unavailable");
  });
});
