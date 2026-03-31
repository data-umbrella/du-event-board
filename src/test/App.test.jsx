import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0)); // Apr 15, 2026 (local)
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setDateFilter = (value) => {
    const dateFilterSelect = screen.getByLabelText("Date filter");
    fireEvent.change(dateFilterSelect, { target: { value } });
  };

  it("renders the header with the site title", () => {
    render(<App />);
    expect(screen.getByText("DU Event Board")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<App />);
    expect(
      screen.getByText(
        "Discover tech events, meetups, and workshops near your region",
      ),
    ).toBeInTheDocument();
  });

  it("renders event cards", () => {
    render(<App />);
    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Community Hackathon - Florianópolis"),
    ).toBeInTheDocument();
  });

  it("shows only upcoming events count in All Dates view (#32)", () => {
    render(<App />);
    const resultsInfo = screen.getByText(/Showing/);
    expect(resultsInfo).toBeInTheDocument();
    expect(resultsInfo.textContent).toContain("2");
    expect(resultsInfo.textContent).toContain("events");
  });

  it("does not show past events in All Dates view (#32)", () => {
    render(<App />);
    expect(
      screen.queryByText("Python Meetup - Porto Alegre"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("React Workshop - São Paulo"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Open Source Friday - Curitiba"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Data Science Bootcamp - Rio de Janeiro"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("UX Design Workshop - Porto Alegre"),
    ).not.toBeInTheDocument();
  });

  it("shows only future events in All Dates view (#32)", () => {
    render(<App />);
    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Community Hackathon - Florianópolis"),
    ).toBeInTheDocument();
  });

  it("filters events by search term", () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText(
      "Search events by name, description, or tags...",
    );

    fireEvent.change(searchInput, { target: { value: "rust" } });

    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Community Hackathon - Florianópolis"),
    ).not.toBeInTheDocument();
  });

  it("filters events by region", () => {
    render(<App />);
    const regionSelect = screen.getByDisplayValue("All Regions");

    fireEvent.change(regionSelect, { target: { value: "São Paulo" } });

    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Community Hackathon - Florianópolis"),
    ).not.toBeInTheDocument();
  });

  it("filters events by category", () => {
    render(<App />);
    const categorySelect = screen.getByDisplayValue("All Categories");

    fireEvent.change(categorySelect, { target: { value: "Community" } });

    expect(
      screen.getByText("Community Hackathon - Florianópolis"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Rust Programming Intro - São Paulo"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state when no events match", () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText(
      "Search events by name, description, or tags...",
    );

    fireEvent.change(searchInput, {
      target: { value: "xyznonexistentevent" },
    });

    expect(screen.getByText("No events found")).toBeInTheDocument();
  });

  it("has an accessible date filter select", () => {
    render(<App />);
    expect(screen.getByLabelText("Date filter")).toBeInTheDocument();
  });

  it("filters events by upcoming", () => {
    render(<App />);
    setDateFilter("upcoming");

    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Community Hackathon - Florianópolis"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("UX Design Workshop - Porto Alegre"),
    ).not.toBeInTheDocument();
  });

  it("filters events by thisWeek", () => {
    render(<App />);
    setDateFilter("thisWeek");

    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Community Hackathon - Florianópolis"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("UX Design Workshop - Porto Alegre"),
    ).not.toBeInTheDocument();
  });

  it("filters events by thisMonth", () => {
    render(<App />);
    setDateFilter("thisMonth");

    expect(
      screen.getByText("DevOps Meetup - Belo Horizonte"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Community Hackathon - Florianópolis"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Python Meetup - Porto Alegre"),
    ).not.toBeInTheDocument();
  });

  it("filters events by customDate", () => {
    render(<App />);
    setDateFilter("customDate");

    const customDateInput = screen.getByLabelText("Custom date");
    fireEvent.change(customDateInput, { target: { value: "2026-04-10" } });

    expect(
      screen.getByText("DevOps Meetup - Belo Horizonte"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Rust Programming Intro - São Paulo"),
    ).not.toBeInTheDocument();
  });

  it("filters events by customRange", () => {
    render(<App />);
    setDateFilter("customRange");

    fireEvent.change(screen.getByLabelText("Range start date"), {
      target: { value: "2026-04-10" },
    });
    fireEvent.change(screen.getByLabelText("Range end date"), {
      target: { value: "2026-04-18" },
    });

    expect(
      screen.getByText("DevOps Meetup - Belo Horizonte"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("UX Design Workshop - Porto Alegre"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Community Hackathon - Florianópolis"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Data Science Bootcamp - Rio de Janeiro"),
    ).not.toBeInTheDocument();
  });

  it("shows no events for reversed invalid customRange", () => {
    render(<App />);
    setDateFilter("customRange");

    fireEvent.change(screen.getByLabelText("Range start date"), {
      target: { value: "2026-04-18" },
    });
    fireEvent.change(screen.getByLabelText("Range end date"), {
      target: { value: "2026-04-10" },
    });

    expect(screen.getByText("No events found")).toBeInTheDocument();
  });

  it("shows Clear All Filters button when a filter is active", () => {
    render(<App />);

    // No active filters yet — button should not exist
    expect(
      screen.queryByRole("button", { name: /clear all filters/i }),
    ).not.toBeInTheDocument();

    // Apply a region filter
    fireEvent.change(screen.getByDisplayValue("All Regions"), {
      target: { value: "São Paulo" },
    });

    // Button should now appear
    expect(
      screen.getByRole("button", { name: /clear all filters/i }),
    ).toBeInTheDocument();
  });

  it("clears all filters when Clear All Filters button is clicked", () => {
    render(<App />);

    // Apply region and category filters
    fireEvent.change(screen.getByDisplayValue("All Regions"), {
      target: { value: "São Paulo" },
    });
    fireEvent.change(screen.getByDisplayValue("All Categories"), {
      target: { value: "Community" },
    });

    // Click the clear button
    fireEvent.click(
      screen.getByRole("button", { name: /clear all filters/i }),
    );

    // Button should disappear — all filters back to default
    expect(
      screen.queryByRole("button", { name: /clear all filters/i }),
    ).not.toBeInTheDocument();
  });
});
