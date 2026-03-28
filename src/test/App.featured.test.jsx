import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("../data/events.json", () => ({
  default: [
    {
      id: "f1",
      title: "Featured Alpha",
      description: "Desc A",
      date: "2026-06-01",
      time: "10:00",
      location: "L1",
      region: "R1",
      category: "Technology",
      url: "https://example.com/a",
      featured: true,
      featured_rank: 2,
    },
    {
      id: "f2",
      title: "Featured Beta",
      description: "Desc B",
      date: "2026-06-02",
      time: "11:00",
      location: "L2",
      region: "R2",
      category: "Technology",
      url: "https://example.com/b",
      featured: true,
      featured_rank: 1,
    },
    {
      id: "n1",
      title: "Normal Gamma",
      description: "Desc G",
      date: "2026-06-03",
      time: "12:00",
      location: "L3",
      region: "R1",
      category: "Education",
      url: "https://example.com/g",
    },
    {
      id: "f3",
      title: "Featured Delta",
      description: "Desc D",
      date: "2026-06-04",
      time: "13:00",
      location: "L4",
      region: "R3",
      category: "Community",
      url: "https://example.com/d",
      featured: true,
      featured_rank: 3,
    },
    {
      id: "f4",
      title: "Featured Epsilon",
      description: "Desc E",
      date: "2026-06-05",
      time: "14:00",
      location: "L5",
      region: "R3",
      category: "Community",
      url: "https://example.com/e",
      featured: true,
      featured_rank: 4,
    },
  ],
}));

import App from "../App";

describe("Featured strip (mock data)", () => {
  let scrollIntoViewMock;

  beforeEach(() => {
    scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    delete window.HTMLElement.prototype.scrollIntoView;
    vi.useRealTimers();
  });

  it("shows up to three featured cards ordered by featured_rank then date", () => {
    const { container } = render(<App />);
    const strip = container.querySelector(".featured-strip");
    expect(strip).toBeTruthy();
    const stripCards = within(strip).getAllByRole("article");
    expect(stripCards).toHaveLength(3);
    expect(stripCards[0]).toHaveTextContent("Featured Beta");
    expect(stripCards[1]).toHaveTextContent("Featured Alpha");
    expect(stripCards[2]).toHaveTextContent("Featured Delta");

    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByText("Featured Epsilon")).toBeInTheDocument();
  });

  it("keeps the main list count equal to all matching events", () => {
    render(<App />);
    const resultsInfo = screen.getByText(/Showing/);
    expect(resultsInfo.textContent).toContain("5");
    expect(resultsInfo.textContent).toContain("events");
  });

  it("offers More events and scrolls to the grid when there are over three featured", () => {
    render(<App />);
    const more = screen.getByRole("button", { name: /more events/i });
    expect(more).toBeInTheDocument();
    fireEvent.click(more);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
