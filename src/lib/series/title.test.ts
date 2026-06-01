import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  displayTitleFromAniList,
  franchiseRootFromTitle,
  pickConsolidatedFranchiseRoot,
  sameFranchiseTitle,
  slugifySeriesTitle,
  stripSeasonSuffix,
} from "./title";

describe("stripSeasonSuffix", () => {
  it("removes season and part suffixes with numbers", () => {
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen Season 2"), "Jujutsu Kaisen");
    assert.equal(
      stripSeasonSuffix("Jujutsu Kaisen Season 3: The Culling Game Part 1"),
      "Jujutsu Kaisen",
    );
    assert.equal(stripSeasonSuffix("Frieren Part 2"), "Frieren");
    assert.equal(stripSeasonSuffix("Show Name Cour 2"), "Show Name");
    assert.equal(stripSeasonSuffix("Show Name S2"), "Show Name");
  });

  it("removes Roman numeral season markers", () => {
    assert.equal(stripSeasonSuffix("Mob Psycho 100 II"), "Mob Psycho 100");
    assert.equal(stripSeasonSuffix("Mob Psycho 100 III"), "Mob Psycho 100");
  });

  it("leaves base titles unchanged", () => {
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen"), "Jujutsu Kaisen");
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen 0"), "Jujutsu Kaisen 0");
    assert.equal(stripSeasonSuffix("Mob Psycho 100"), "Mob Psycho 100");
  });
});

describe("franchiseRootFromTitle", () => {
  it("groups Demon Slayer seasons under one root", () => {
    assert.equal(
      franchiseRootFromTitle("Demon Slayer: Kimetsu no Yaiba"),
      "Demon Slayer: Kimetsu no Yaiba",
    );
    assert.equal(
      franchiseRootFromTitle(
        "Demon Slayer: Kimetsu no Yaiba Hashira Training Arc",
      ),
      "Demon Slayer: Kimetsu no Yaiba",
    );
    assert.equal(
      franchiseRootFromTitle(
        "Demon Slayer: Kimetsu no Yaiba Swordsmith Village Arc",
      ),
      "Demon Slayer: Kimetsu no Yaiba",
    );
  });

  it("groups Mob Psycho seasons under one root", () => {
    assert.equal(franchiseRootFromTitle("Mob Psycho 100"), "Mob Psycho 100");
    assert.equal(franchiseRootFromTitle("Mob Psycho 100 II"), "Mob Psycho 100");
    assert.equal(franchiseRootFromTitle("Mob Psycho 100 III"), "Mob Psycho 100");
  });

  it("groups franchise movies under the main show title", () => {
    assert.equal(
      franchiseRootFromTitle("Black Clover: Sword of the Wizard King"),
      "Black Clover",
    );
  });

  it("groups prequel zero movies with the main franchise", () => {
    assert.equal(
      franchiseRootFromTitle("Jujutsu Kaisen 0"),
      "Jujutsu Kaisen",
    );
    assert.equal(
      franchiseRootFromTitle("JUJUTSU KAISEN 0"),
      "JUJUTSU KAISEN",
    );
  });
});

describe("pickConsolidatedFranchiseRoot", () => {
  it("prefers the shared prefix root across cluster members", () => {
    assert.equal(
      pickConsolidatedFranchiseRoot([
        "Black Clover",
        "Black Clover: Sword of the Wizard King",
      ]),
      "Black Clover",
    );
  });

  it("does not pick an unrelated shortest title (OP single vs show)", () => {
    assert.equal(
      pickConsolidatedFranchiseRoot([
        "Just Awake",
        "Hunter x Hunter",
        "Hunter x Hunter (2011)",
      ]),
      "Hunter x Hunter",
    );
  });
});

describe("slugifySeriesTitle", () => {
  it("includes anilist id for uniqueness", () => {
    assert.equal(
      slugifySeriesTitle("Jujutsu Kaisen", 145064),
      "jujutsu-kaisen-145064",
    );
  });
});

describe("sameFranchiseTitle", () => {
  it("treats seasons as the same franchise", () => {
    assert.equal(
      sameFranchiseTitle("Jujutsu Kaisen", "Jujutsu Kaisen Season 2"),
      true,
    );
    assert.equal(sameFranchiseTitle("Naruto", "One Piece"), false);
  });
});

describe("displayTitleFromAniList", () => {
  it("normalizes AniList titles to franchise root", () => {
    assert.equal(
      displayTitleFromAniList({
        english: "Demon Slayer: Kimetsu no Yaiba",
        romaji: null,
        native: null,
      }),
      "Demon Slayer: Kimetsu no Yaiba",
    );
  });
});
