import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ShareButton } from "@/components/share/share-button";

function stubNavigator(overrides: Partial<Navigator>) {
  const keys = Object.keys(overrides) as (keyof Navigator)[];
  const originalDescriptors = keys.map(
    (key) => [key, Object.getOwnPropertyDescriptor(navigator, key)] as const,
  );

  for (const key of keys) {
    Object.defineProperty(navigator, key, {
      value: overrides[key],
      configurable: true,
    });
  }

  return () => {
    for (const [key, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(navigator, key, descriptor);
      else delete (navigator as unknown as Record<string, unknown>)[key as string];
    }
  };
}

describe("ShareButton", () => {
  afterEach(() => cleanup());

  it("uses the label prop and includes the title in the aria-label", () => {
    render(<ShareButton url="https://example.com" title="My Profile" label="Share profile" />);
    screen.getByRole("button", { name: "Share profile link: My Profile" });
    screen.getByText("Share profile");
  });

  it("calls navigator.share with the given url/title/text when available", async () => {
    let sharedWith: unknown = null;
    const restore = stubNavigator({
      share: async (data) => {
        sharedWith = data;
      },
    } as Partial<Navigator>);

    render(<ShareButton url="https://example.com/a" title="Title" text="Text" />);
    await fireEvent.click(screen.getByRole("button"));
    assert.deepEqual(sharedWith, {
      title: "Title",
      text: "Text",
      url: "https://example.com/a",
    });
    restore();
  });

  it("falls back to clipboard copy and shows confirmation when share is unavailable", async () => {
    let copiedText: string | null = null;
    const restore = stubNavigator({
      share: undefined,
      clipboard: {
        writeText: async (value: string) => {
          copiedText = value;
        },
      } as Clipboard,
    } as Partial<Navigator>);

    render(<ShareButton url="https://example.com/b" label="Share" />);
    await fireEvent.click(screen.getByRole("button"));
    assert.equal(copiedText, "https://example.com/b");
    await screen.findByText("Link copied");
    restore();
  });
});
