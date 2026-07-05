import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  displayTitleFromAniList,
  franchiseLookupRoots,
  franchiseRootFromTitle,
  pickConsolidatedFranchiseRoot,
  pickConsolidatedFranchiseRootFromMembers,
  sameFranchiseTitle,
  slugifySeriesTitle,
  stripSeasonSuffix,
} from "@/lib/series/title";

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

  it("removes ordinal and final season variants", () => {
    assert.equal(stripSeasonSuffix("One Punch Man 2nd Season"), "One Punch Man");
    assert.equal(stripSeasonSuffix("Attack on Titan The Final Season"), "Attack on Titan");
    assert.equal(
      stripSeasonSuffix("Attack on Titan Final Season Part 2"),
      "Attack on Titan",
    );
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
      pickConsolidatedFranchiseRoot([
        "Black Clover",
        "Black Clover: Sword of the Wizard King",
      ]),
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

  it("keeps identity-bearing colon subtitles", () => {
    assert.equal(
      franchiseRootFromTitle("Kaguya-sama: Love is War"),
      "Kaguya-sama: Love is War",
    );
    assert.equal(
      franchiseRootFromTitle("Frieren: Beyond Journey's End"),
      "Frieren: Beyond Journey's End",
    );
    assert.equal(
      franchiseRootFromTitle("Wistoria: Wand and Sword"),
      "Wistoria: Wand and Sword",
    );
    assert.equal(
      franchiseRootFromTitle("Fullmetal Alchemist: Brotherhood"),
      "Fullmetal Alchemist: Brotherhood",
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

  it("prefers the most frequent root when no shared prefix exists", () => {
    // Seasons repeat once per cluster node; a movie subtitle and a romaji
    // fallback title break the shared-prefix heuristic. The franchise should
    // still win on frequency, not the longest subtitle.
    assert.equal(
      pickConsolidatedFranchiseRoot([
        "My Hero Academia",
        "My Hero Academia",
        "My Hero Academia",
        "My Hero Academia: Heroes Rising",
        "Boku no Hero Academia: Two Heroes",
      ]),
      "My Hero Academia",
    );
  });

  it("keeps an identity-bearing colon franchise over a one-off OVA subtitle", () => {
    assert.equal(
      pickConsolidatedFranchiseRoot([
        "Kaguya-sama: Love is War",
        "Kaguya-sama: Love is War",
        'Kaguya-sama: Love is War -Ultra Romantic- "Yu Ishigami Wants to Chat"',
      ]),
      "Kaguya-sama: Love is War",
    );
  });
});

describe("pickConsolidatedFranchiseRootFromMembers", () => {
  it("groups by romaji identity but displays the English title", () => {
    assert.equal(
      pickConsolidatedFranchiseRootFromMembers([
        { english: null, romaji: "Shingeki no Kyojin" },
        { english: null, romaji: "Shingeki no Kyojin Season 2" },
        { english: "Attack on Titan", romaji: "Shingeki no Kyojin" },
      ]),
      "Attack on Titan",
    );
  });

  it("prefers the English display over a more frequent romaji-only variant", () => {
    assert.equal(
      pickConsolidatedFranchiseRootFromMembers([
        { english: "Kuroko's Basketball", romaji: "Kuroko no Basket" },
        { english: null, romaji: "Kuroko no Basket 2nd Season" },
        { english: null, romaji: "Kuroko no Basket 3rd Season" },
      ]),
      "Kuroko's Basketball",
    );
  });

  it("falls back to romaji when no member has an English title", () => {
    assert.equal(
      pickConsolidatedFranchiseRootFromMembers([
        { english: null, romaji: "Nitian Xie Shen" },
        { english: null, romaji: "Nitian Xie Shen: Nian Fan" },
      ]),
      "Nitian Xie Shen",
    );
  });

  it("still consolidates franchise movies via the shared prefix", () => {
    assert.equal(
      pickConsolidatedFranchiseRootFromMembers([
        { english: "Black Clover", romaji: "Black Clover" },
        {
          english: "Black Clover: Sword of the Wizard King",
          romaji: "Black Clover: Mahou Tei no Ken",
        },
      ]),
      "Black Clover",
    );
  });

  it("names a multi-TV franchise after the earliest installment, not the shortest title", () => {
    // Seishun Buta Yarou has two TV series with distinct romaji identities, so
    // frequency ties. The 2025 "Santa Claus" cour has a shorter title than the
    // 2018 original, so a length-only tie-break mislabels the franchise.
    assert.equal(
      pickConsolidatedFranchiseRootFromMembers([
        {
          english: "Rascal Does Not Dream of Bunny Girl Senpai",
          romaji: "Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai",
          seasonYear: 2018,
        },
        {
          english: "Rascal Does Not Dream of Santa Claus",
          romaji: "Seishun Buta Yarou wa Santa Claus no Yume wo Minai",
          seasonYear: 2025,
        },
      ]),
      "Rascal Does Not Dream of Bunny Girl Senpai",
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

  it("matches legacy short colon forms to canonical title", () => {
    assert.equal(
      sameFranchiseTitle("Kaguya-sama", "Kaguya-sama: Love is War"),
      true,
    );
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

describe("franchiseLookupRoots", () => {
  it("returns canonical root first with legacy colon fallback", () => {
    assert.deepEqual(franchiseLookupRoots("Kaguya-sama: Love is War"), [
      "Kaguya-sama: Love is War",
      "Kaguya-sama",
    ]);
  });
});
