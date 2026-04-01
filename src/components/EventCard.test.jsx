import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCard from "./EventCard";

describe("EventCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the event card with all fields", () => {
    render(
      <EventCard
        event={{
          id: "1",
          category: "Workshop",
          title: "React Workshop",
          description: "Build UI with React.",
          date: "2026-04-15",
          time: "10:00 AM",
          location: "São Paulo",
          tags: ["react", "frontend"],
          url: "https://example.com",
        }}
      />,
    );

    expect(screen.getByText("React Workshop")).toBeInTheDocument();
    expect(screen.getByText("Build UI with React.")).toBeInTheDocument();
    expect(screen.getByText(/Live Now|live now/i)).toBeInTheDocument();
    expect(screen.queryByText("TBA")).not.toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("Learn more")).toBeInTheDocument();
  });

  it("shows fallbacks when event fields are missing", () => {
    render(
      <EventCard
        event={{
          id: "2",
          date: "",
          tags: [],
        }}
      />,
    );

    expect(screen.getByText("Untitled event")).toBeInTheDocument();
    expect(screen.getByText("No description available.")).toBeInTheDocument();
    expect(screen.getByText("Date unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("TBA")).toHaveLength(2);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.queryByText("Learn more")).not.toBeInTheDocument();
  });
});
