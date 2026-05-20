import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";

import events from "../data/events.json";

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0)); // Apr 15, 2026 (local)
    // Clear the URL global state so tests don't leak into each other when reading window.location.search
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
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
    expect(screen.getByText("React Workshop - São Paulo")).toBeInTheDocument();
  });

  it("shows the total events count", () => {
    render(<App />);
    const resultsInfo = screen.getByText(/Showing/);
    expect(resultsInfo).toBeInTheDocument();
    expect(resultsInfo.textContent).toContain(String(events.length));
    expect(resultsInfo.textContent).toContain("events");
  });

  it("filters events by search term", () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText(
      "Search events by name, description, or tags...",
    );

    fireEvent.change(searchInput, { target: { value: "python" } });

    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Data Science Bootcamp - Rio de Janeiro"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("React Workshop - São Paulo"),
    ).not.toBeInTheDocument();
  });

  it("filters events by region", () => {
    render(<App />);
    const regionSelect = screen.getByDisplayValue("All Regions");

    fireEvent.change(regionSelect, { target: { value: "Porto Alegre" } });

    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("UX Design Workshop - Porto Alegre"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("React Workshop - São Paulo"),
    ).not.toBeInTheDocument();
  });

  it("filters events by category", () => {
    render(<App />);
    const categorySelect = screen.getByDisplayValue("All Categories");

    fireEvent.change(categorySelect, { target: { value: "Education" } });

    expect(
      screen.getByText("Data Science Bootcamp - Rio de Janeiro"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Python Meetup - Porto Alegre"),
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

  it("restores filter state when popstate updates browser URL", () => {
    render(<App />);

    const regionSelect = screen.getByLabelText("Region filter");
    const categorySelect = screen.getByLabelText("Category filter");

    fireEvent.change(regionSelect, { target: { value: "Porto Alegre" } });
    fireEvent.change(categorySelect, { target: { value: "Education" } });

    expect(window.location.search).toContain("region=Porto+Alegre");
    expect(window.location.search).toContain("category=Education");
    expect(screen.getByText("No events found")).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "/?region=Porto+Alegre");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByLabelText("Category filter").value).toBe("");
    expect(screen.getByLabelText("Region filter").value).toBe("Porto Alegre");
    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByLabelText("Region filter").value).toBe("");
    expect(screen.getByText("React Workshop - São Paulo")).toBeInTheDocument();
  });
});
