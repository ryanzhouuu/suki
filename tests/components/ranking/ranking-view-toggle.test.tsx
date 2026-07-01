import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type {
  RankingViewToggle as RankingViewToggleType,
  useRankingView as useRankingViewType,
} from "@/components/ranking/ranking-view-toggle";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { router, setPathname, setSearchParams } = installNavigationMock({
  pathname: "/ranking",
});

let RankingViewToggle: typeof RankingViewToggleType;
let useRankingView: typeof useRankingViewType;

before(async () => {
  ({ RankingViewToggle, useRankingView } = await import(
    "@/components/ranking/ranking-view-toggle"
  ));
});

describe("RankingViewToggle", () => {
  afterEach(() => cleanup());

  it("marks the current view as selected", () => {
    render(<RankingViewToggle view="tiers" onChange={() => {}} />);
    assert.equal(
      screen.getByRole("tab", { name: "Tiers" }).getAttribute("aria-selected"),
      "true",
    );
    assert.equal(
      screen.getByRole("tab", { name: "List" }).getAttribute("aria-selected"),
      "false",
    );
  });

  it("calls onChange with the clicked view", () => {
    let selected: string | null = null;
    render(<RankingViewToggle view="list" onChange={(v) => (selected = v)} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tiers" }));
    assert.equal(selected, "tiers");
  });
});

function ViewProbe({ initial }: { initial: "list" | "tiers" }) {
  const { view, setView } = useRankingView(initial);
  return <RankingViewToggle view={view} onChange={setView} />;
}

describe("useRankingView", () => {
  afterEach(() => {
    cleanup();
    setPathname("/ranking");
    setSearchParams("");
    router.replace = () => {};
  });

  it("uses the initial view when there's no ?view= param", () => {
    render(<ViewProbe initial="tiers" />);
    assert.equal(
      screen.getByRole("tab", { name: "Tiers" }).getAttribute("aria-selected"),
      "true",
    );
  });

  it("reads the view from the URL when present", () => {
    setSearchParams("view=tiers");
    render(<ViewProbe initial="list" />);
    assert.equal(
      screen.getByRole("tab", { name: "Tiers" }).getAttribute("aria-selected"),
      "true",
    );
  });

  it("sets the view param when switching away from list", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<ViewProbe initial="list" />);
    fireEvent.click(screen.getByRole("tab", { name: "Tiers" }));
    assert.equal(replaced, "/ranking?view=tiers");
  });

  it("removes the view param when switching back to list", () => {
    setSearchParams("view=tiers");
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<ViewProbe initial="list" />);
    fireEvent.click(screen.getByRole("tab", { name: "List" }));
    assert.equal(replaced, "/ranking");
  });
});
