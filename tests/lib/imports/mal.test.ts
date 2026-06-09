import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapMalStatus,
  normalizeMalScore,
  parseMalXml,
} from "@/lib/imports/mal";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<myanimelist>
  <myinfo>
    <user_name>tester</user_name>
    <user_total_anime>3</user_total_anime>
  </myinfo>
  <anime>
    <series_animedb_id>21</series_animedb_id>
    <series_title><![CDATA[One Piece]]></series_title>
    <series_type>TV</series_type>
    <my_watched_episodes>1000</my_watched_episodes>
    <my_score>10</my_score>
    <my_status>Watching</my_status>
  </anime>
  <anime>
    <series_animedb_id>5114</series_animedb_id>
    <series_title><![CDATA[Fullmetal Alchemist: Brotherhood]]></series_title>
    <series_type>TV</series_type>
    <my_watched_episodes>64</my_watched_episodes>
    <my_score>0</my_score>
    <my_status>Completed</my_status>
  </anime>
  <anime>
    <series_animedb_id>9999</series_animedb_id>
    <series_title><![CDATA[Some Plan]]></series_title>
    <series_type>TV</series_type>
    <my_watched_episodes>0</my_watched_episodes>
    <my_score>7</my_score>
    <my_status>Plan to Watch</my_status>
  </anime>
</myanimelist>`;

describe("parseMalXml", () => {
  it("extracts one entry per <anime> node with id, title, score, progress, status", () => {
    const entries = parseMalXml(SAMPLE_XML);
    assert.equal(entries.length, 3);

    assert.deepEqual(entries[0], {
      malId: 21,
      title: "One Piece",
      rawStatus: "Watching",
      score: 10,
      watchedEpisodes: 1000,
    });
  });

  it("decodes CDATA titles", () => {
    const entries = parseMalXml(SAMPLE_XML);
    assert.equal(entries[1].title, "Fullmetal Alchemist: Brotherhood");
  });

  it("returns an empty array when there are no anime nodes", () => {
    assert.deepEqual(parseMalXml("<myanimelist></myanimelist>"), []);
  });

  it("decodes XML entities in titles", () => {
    const xml = `<myanimelist><anime>
      <series_animedb_id>1</series_animedb_id>
      <series_title>Fruits Basket &amp; Friends</series_title>
      <my_watched_episodes>0</my_watched_episodes>
      <my_score>0</my_score>
      <my_status>Completed</my_status>
    </anime></myanimelist>`;
    assert.equal(parseMalXml(xml)[0].title, "Fruits Basket & Friends");
  });
});

describe("mapMalStatus", () => {
  it("maps every MAL status string to our entry status", () => {
    assert.equal(mapMalStatus("Watching"), "watching");
    assert.equal(mapMalStatus("Completed"), "completed");
    assert.equal(mapMalStatus("On-Hold"), "paused");
    assert.equal(mapMalStatus("Dropped"), "dropped");
    assert.equal(mapMalStatus("Plan to Watch"), "plan_to_watch");
  });

  it("maps MAL numeric status codes", () => {
    assert.equal(mapMalStatus("1"), "watching");
    assert.equal(mapMalStatus("2"), "completed");
    assert.equal(mapMalStatus("3"), "paused");
    assert.equal(mapMalStatus("4"), "dropped");
    assert.equal(mapMalStatus("6"), "plan_to_watch");
  });

  it("returns null for unknown statuses", () => {
    assert.equal(mapMalStatus("Bogus"), null);
  });
});

describe("normalizeMalScore", () => {
  it("treats 0 as no score", () => {
    assert.equal(normalizeMalScore(0), null);
  });

  it("passes through a 1-10 score", () => {
    assert.equal(normalizeMalScore(7), 7);
  });

  it("clamps out-of-range values", () => {
    assert.equal(normalizeMalScore(12), 10);
    assert.equal(normalizeMalScore(-3), null);
  });
});
