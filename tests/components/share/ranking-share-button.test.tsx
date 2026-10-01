/** Exercises ranking exports and the retained profile-link action in the share dialog. */
import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RankingShareButton } from "@/components/share/ranking-share-button";
import { buildRankingTextExport } from "@/lib/ranking/export";

const url = "https://example.com/u/ryan";
const rankingExport = buildRankingTextExport({
  url,
  username: "ryan",
  rankings: Array.from({ length: 15 }, (_, index) => ({
    rank: index + 1,
    series: { canonical_title: `Series ${index + 1}` },
  })),
});
const restores: (() => void)[] = [];

/** Restores browser APIs after each case, including absent own properties. */
function stubProperty(target: object, key: string, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { value, configurable: true });
  restores.push(() => {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  });
}

/** Opens the real share dialog with a complete ranking fixture. */
function openShare() {
  render(<RankingShareButton url={url} rankingExport={rankingExport} />);
  fireEvent.click(screen.getByRole("button", { name: "Share rankings" }));
}

describe("RankingShareButton", () => {
  afterEach(() => {
    cleanup();
    mock.restoreAll();
    while (restores.length) restores.pop()!();
  });

  it("opens a complete numbered preview and restores trigger focus on Escape", () => {
    openShare();
    screen.getByRole("dialog", { name: "Share your ranking" });
    const preview = screen.getByRole("textbox", { name: "Full numbered ranking" }) as HTMLTextAreaElement;
    assert.equal(preview.value, rankingExport.text);
    assert.ok(preview.value.includes("15. Series 15"));
    assert.equal(preview.readOnly, true);
    fireEvent.keyDown(document, { key: "Escape" });
    assert.equal(screen.queryByRole("dialog"), null);
    const trigger = screen.getByRole("button", { name: "Share rankings" });
    assert.equal(document.activeElement, trigger);
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
  });

  it("copies the full ranking and announces success", async () => {
    let copied = "";
    stubProperty(navigator, "clipboard", { writeText: async (text: string) => { copied = text; } });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Copy numbered ranking" }));
    await screen.findByText("Ranking copied");
    assert.equal(copied, rankingExport.text);
    assert.equal(screen.getByRole("status").textContent, "Ranking copied");
  });

  it("shows manual copy/download guidance when clipboard permission is denied", async () => {
    stubProperty(navigator, "clipboard", { writeText: async () => { throw new Error("Denied"); } });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Copy numbered ranking" }));
    await screen.findByText("Could not copy. Select and copy the ranking below, or download it.");
    assert.equal((screen.getByRole("textbox") as HTMLTextAreaElement).value, rankingExport.text);
  });

  it("downloads the same UTF-8 text with the owner filename and releases the blob URL", async () => {
    let blob: Blob | undefined;
    let downloaded: { href: string; filename: string } | undefined;
    const revoked: string[] = [];
    const timers: (() => void)[] = [];
    stubProperty(URL, "createObjectURL", (value: Blob) => { blob = value; return "blob:ranking"; });
    stubProperty(URL, "revokeObjectURL", (value: string) => revoked.push(value));
    mock.method(window, "setTimeout", (callback: () => void) => { timers.push(callback); return 1; });
    mock.method(HTMLAnchorElement.prototype, "click", function (this: HTMLAnchorElement) {
      downloaded = { href: this.href, filename: this.download };
    });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Download .txt" }));
    assert.deepEqual(downloaded, { href: "blob:ranking", filename: rankingExport.filename });
    assert.equal(blob?.type, "text/plain;charset=utf-8");
    assert.equal(await blob?.text(), rankingExport.text);
    screen.getByText("Ranking download started");
    assert.equal(document.querySelector("a[download]"), null);
    for (const callback of timers) callback();
    assert.deepEqual(revoked, ["blob:ranking"]);
  });

  it("provides manual copy guidance when downloads are unavailable", () => {
    stubProperty(URL, "createObjectURL", () => { throw new Error("Unavailable"); });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Download .txt" }));
    screen.getByText("Could not download. Select and copy the ranking below.");
  });

  it("still shares the profile link through the native share sheet", () => {
    let shared: ShareData | undefined;
    stubProperty(navigator, "share", async (data: ShareData) => { shared = data; });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Share profile link: My anime rankings on Suki" }));
    assert.deepEqual(shared, { title: "My anime rankings on Suki", text: undefined, url });
  });

  it("still copies the profile link when native sharing is unavailable", async () => {
    let copied = "";
    stubProperty(navigator, "share", undefined);
    stubProperty(navigator, "clipboard", { writeText: async (text: string) => { copied = text; } });
    openShare();
    fireEvent.click(screen.getByRole("button", { name: "Share profile link: My anime rankings on Suki" }));
    await screen.findByText("Link copied");
    assert.equal(copied, url);
  });

  it("disables exports for an empty ranking while keeping link sharing available", () => {
    render(<RankingShareButton url={url} rankingExport={buildRankingTextExport({ url, username: "ryan", rankings: [] })} />);
    fireEvent.click(screen.getByRole("button", { name: "Share rankings" }));
    for (const name of ["Copy numbered ranking", "Download .txt"]) {
      assert.equal((screen.getByRole("button", { name }) as HTMLButtonElement).disabled, true);
    }
    assert.equal(screen.queryByRole("textbox"), null);
    screen.getByRole("button", { name: "Share profile link: My anime rankings on Suki" });
  });
});
