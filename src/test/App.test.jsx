import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    const labelMap = {
      upcoming: "Upcoming",
      thisWeek: "This Week",
      thisMonth: "This Month",
      customDate: "Custom Date",
      customRange: "Custom Range",
    };
    const label = labelMap[value] || value;
    const dateFilterInput = screen.getByPlaceholderText("All Dates");
    fireEvent.change(dateFilterInput, { target: { value: label } });
    fireEvent.click(screen.getByText(label, { selector: "li" }));
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
    const regionSelect = screen.getByPlaceholderText("Region");

    fireEvent.change(regionSelect, { target: { value: "South America" } });
    fireEvent.click(screen.getByText("South America", { selector: "li" }));

    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("UX Design Workshop - Porto Alegre"),
    ).toBeInTheDocument();
  });

  it("filters events by city", () => {
    render(<App />);
    const citySelect = screen.getByPlaceholderText("City");

    fireEvent.change(citySelect, { target: { value: "Porto Alegre" } });
    fireEvent.click(screen.getByText("Porto Alegre", { selector: "li" }));

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
    const categorySelect = screen.getByPlaceholderText("All Categories");

    fireEvent.change(categorySelect, { target: { value: "Education" } });
    fireEvent.click(screen.getByText("Education", { selector: "li" }));

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
    expect(screen.getByPlaceholderText("All Dates")).toBeInTheDocument();
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
  it("matches multi-day events on any day in their range for customDate filter", () => {
    // Find a multi-day event dynamically
    const testEvent = events.find((e) => e.end_date && e.end_date !== e.date);
    if (!testEvent) return;

    render(<App />);
    setDateFilter("customDate");

    const customDateInput = screen.getByLabelText("Custom date");
    fireEvent.change(customDateInput, {
      target: { value: testEvent.end_date },
    });

    const title = testEvent.title || testEvent.event_name;
    expect(screen.getByText(title)).toBeInTheDocument();
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

  it("navigates to event details page when clicking event title and back to main list when clicking Back to Events", () => {
    render(<App />);

    // Click on the first event card
    const firstEventTitle = screen.getByText("Python Meetup - Porto Alegre");
    fireEvent.click(firstEventTitle);

    // Should render the event details page structure
    expect(screen.getByText("About this Event")).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByRole("button", { name: /Back to Events/i });
    fireEvent.click(backButton);

    // Should return to the main board page
    expect(screen.getByText("DU Event Board")).toBeInTheDocument();
    expect(screen.queryByText("About this Event")).not.toBeInTheDocument();
  });

  it("displays correct start and end times for multi-day events on details page", () => {
    // Find a multi-day event with start_time and end_time dynamically
    const testEvent = events.find(
      (e) => e.end_date && e.end_date !== e.date && e.start_time && e.end_time,
    );

    if (!testEvent) return;

    render(<App />);

    const title = testEvent.title || testEvent.event_name;
    const titleLink = screen.getByText(title);
    fireEvent.click(titleLink);

    expect(screen.getByText("About this Event")).toBeInTheDocument();

    const formatDate = (dateStr) => {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const expectedStartStr = `Starts: ${formatDate(testEvent.date)} at ${testEvent.start_time}`;
    const expectedEndStr = `Ends: ${formatDate(testEvent.end_date)} at ${testEvent.end_time}`;

    expect(screen.getByText(expectedStartStr)).toBeInTheDocument();
    expect(screen.getByText(expectedEndStr)).toBeInTheDocument();
  });

  it("displays computed start and end times along with start and end dates on the main grid/list event card", () => {
    // Find a multi-day event with start_time and end_time dynamically
    const testEvent = events.find(
      (e) => e.end_date && e.end_date !== e.date && e.start_time && e.end_time,
    );

    if (!testEvent) return;

    render(<App />);

    const formatDate = (dateStr) => {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const expectedString = `${formatDate(testEvent.date)}, ${testEvent.start_time} – ${formatDate(testEvent.end_date)}, ${testEvent.end_time}`;

    expect(screen.getByText(expectedString)).toBeInTheDocument();
  });
});
