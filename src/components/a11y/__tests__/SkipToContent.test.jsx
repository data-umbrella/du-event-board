import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SkipToContent from "../SkipToContent";

describe("SkipToContent", () => {
  it("links to the default main content target", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", {
      name: "Skip to main content",
    });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("accepts a custom target and label", () => {
    render(<SkipToContent targetId="events-grid" label="Skip to events" />);
    expect(
      screen.getByRole("link", { name: "Skip to events" }),
    ).toHaveAttribute("href", "#events-grid");
  });
});
