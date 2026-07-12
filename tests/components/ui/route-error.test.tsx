import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RouteError } from "@/components/ui/route-error";

describe("RouteError", () => {
  afterEach(cleanup);

  it("shows safe copy, a digest, and navigation actions", () => {
    const error = Object.assign(new Error("secret provider message"), {
      digest: "route-digest",
    });
    render(
      <RouteError
        error={error}
        links={[{ href: "/home", label: "Go home" }]}
        unstable_retry={() => {}}
      />,
    );

    screen.getByRole("alert");
    screen.getByText("Something went wrong");
    screen.getByText("Reference: route-digest");
    assert.equal(screen.queryByText("secret provider message"), null);
    assert.equal(screen.getByRole("link", { name: "Go home" }).getAttribute("href"), "/home");
  });

  it("calls unstable_retry exactly once per click", () => {
    let retryCalls = 0;
    render(
      <RouteError
        error={new Error("boom")}
        unstable_retry={() => {
          retryCalls += 1;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    assert.equal(retryCalls, 1);
  });
});
