import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { LibrarySetupSuccess as LibrarySetupSuccessType } from "@/components/setup/library-setup-success";

let LibrarySetupSuccess: typeof LibrarySetupSuccessType;

before(async () => {
  ({ LibrarySetupSuccess } = await import(
    "@/components/setup/library-setup-success"
  ));
});

describe("LibrarySetupSuccess", () => {
  afterEach(() => {
    cleanup();
  });

  it("always shows the library CTA when the threshold is met", () => {
    render(<LibrarySetupSuccess libraryCount={5} rankingReady={false} />);
    screen.getByRole("link", { name: "Go to library" });
    screen.getByRole("link", { name: "Add more anime" });
  });

  it("shows the ranking CTA only when enough completed series exist", () => {
    render(<LibrarySetupSuccess libraryCount={8} rankingReady={true} />);
    screen.getByRole("link", { name: "Start ranking" });
  });

  it("hides the ranking CTA when completed series are insufficient", () => {
    render(<LibrarySetupSuccess libraryCount={6} rankingReady={false} />);
    assert.throws(() => screen.getByRole("link", { name: "Start ranking" }));
  });
});
