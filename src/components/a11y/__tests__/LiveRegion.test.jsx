import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LiveRegion from "../LiveRegion";

describe("LiveRegion", () => {
  it("announces the message politely via a status role", () => {
    render(<LiveRegion message="3 events match the current filters" />);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region).toHaveTextContent("3 events match the current filters");
  });

  it("is hidden from view but stays available to screen readers", () => {
    render(<LiveRegion message="updated" />);
    expect(screen.getByRole("status")).toHaveClass("visually-hidden");
  });

  it("supports assertive announcements", () => {
    render(<LiveRegion message="something broke" politeness="assertive" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
  });

  it("renders an empty region when there is nothing to announce", () => {
    render(<LiveRegion message="" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
