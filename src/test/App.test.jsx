import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";
import { createIcsContent } from "../lib/ics";
import { PLANNER_STORAGE_KEY } from "../lib/planner";

describe("App", () => {
  let createObjectURLMock;
  let revokeObjectURLMock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0)); // Apr 15, 2026 (local)
    window.localStorage.removeItem(PLANNER_STORAGE_KEY);

    createObjectURLMock = vi.fn(() => "blob:planner-file");
    revokeObjectURLMock = vi.fn();

    Object.defineProperty(window.URL, "createObjectURL", {
      writable: true,
      value: createObjectURLMock,
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURLMock,
    });
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
    expect(resultsInfo.textContent).toContain("8");
    expect(resultsInfo.textContent).toContain("events");
  });

  it("shows an empty planner by default", () => {
    render(<App />);
    expect(screen.getByText("Your saved events")).toBeInTheDocument();
    expect(screen.getByText("No saved events yet")).toBeInTheDocument();
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

  it("saves an event to the planner and persists it", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Python Meetup - Porto Alegre to planner",
      }),
    );

    expect(screen.getByText("1 saved event")).toBeInTheDocument();
    expect(screen.getAllByText("Python Meetup - Porto Alegre").length).toBe(2);
    expect(
      JSON.parse(window.localStorage.getItem(PLANNER_STORAGE_KEY)),
    ).toEqual(["1"]);
  });

  it("restores saved events from localStorage", () => {
    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(["2"]));

    render(<App />);

    expect(screen.getByText("1 saved event")).toBeInTheDocument();
    expect(screen.getAllByText("React Workshop - São Paulo").length).toBe(2);
  });

  it("exports saved events as a calendar file", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Python Meetup - Porto Alegre to planner",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Export calendar" }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:planner-file");
  });

  it("creates ICS payload with summary, dtstart, and dtend for same-day events", () => {
    const calendarPayload = createIcsContent([
      {
        id: "day-event",
        title: "Python Meetup - Porto Alegre",
        description: "Monthly Python meetup.",
        date: "2026-03-15",
        time: "19:00",
        location: "TechHub",
      },
    ]);

    expect(calendarPayload).toContain("SUMMARY:Python Meetup - Porto Alegre");
    expect(calendarPayload).toContain("DTSTART:20260315T190000");
    expect(calendarPayload).toContain("DTEND:20260315T200000");
  });

  it("creates ICS events with DTEND on next day when an event crosses midnight", () => {
    const calendarPayload = createIcsContent([
      {
        id: "night-event",
        title: "Late Night Coding Session",
        description: "Coding until after midnight.",
        date: "2026-04-10",
        time: "23:30",
        location: "Online",
      },
    ]);

    expect(calendarPayload).toContain("SUMMARY:Late Night Coding Session");
    expect(calendarPayload).toContain("DTSTART:20260410T233000");
    expect(calendarPayload).toContain("DTEND:20260411T003000");
  });
});
