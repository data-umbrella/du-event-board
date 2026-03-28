import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0)); // Apr 15, 2026 (local)
    localStorage.clear();
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

  const getEventCardByTitle = (title) =>
    screen.getByText(title).closest("article");

  const clickJoinEventForTitle = (title) => {
    const card = getEventCardByTitle(title);
    const joinButton = within(card).getByRole("button", {
      name: "Join event",
    });
    fireEvent.click(joinButton);
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

  it("shows a dedicated message when there are no joined events", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^Joined$/ }));

    expect(screen.getByText("No joined events yet")).toBeInTheDocument();
    expect(
      screen.getByText("Join events to see them here."),
    ).toBeInTheDocument();
  });

  it("shows joined events in Joined view after joining", () => {
    render(<App />);

    clickJoinEventForTitle("Rust Programming Intro - São Paulo");
    fireEvent.click(screen.getByRole("button", { name: /^Joined$/ }));

    expect(
      screen.getByText("Rust Programming Intro - São Paulo"),
    ).toBeInTheDocument();
    const resultsInfo = screen.getByText(/Showing/);
    expect(resultsInfo).toHaveTextContent(/Showing\s*1\s*event/);
  });

  it("shows no matching joined events when joined events are filtered out", () => {
    render(<App />);

    clickJoinEventForTitle("Rust Programming Intro - São Paulo");
    fireEvent.click(screen.getByRole("button", { name: /^Joined$/ }));

    const searchInput = screen.getByPlaceholderText(
      "Search events by name, description, or tags...",
    );
    fireEvent.change(searchInput, { target: { value: "python" } });

    expect(screen.getByText("No matching joined events")).toBeInTheDocument();
    expect(
      screen.getByText("Try switching to All or broadening your filters."),
    ).toBeInTheDocument();
  });

  it("returns to empty joined message after canceling the last joined event", () => {
    render(<App />);

    clickJoinEventForTitle("Rust Programming Intro - São Paulo");
    fireEvent.click(screen.getByRole("button", { name: /^Joined$/ }));

    const joinedCard = getEventCardByTitle(
      "Rust Programming Intro - São Paulo",
    );
    const cancelButton = within(joinedCard).getByRole("button", {
      name: "Cancel",
    });
    fireEvent.click(cancelButton);

    expect(screen.getByText("No joined events yet")).toBeInTheDocument();
    expect(
      screen.getByText("Join events to see them here."),
    ).toBeInTheDocument();
  });
});
