import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setDateFilter(value) {
    fireEvent.change(screen.getByLabelText("Date filter"), {
      target: { value },
    });
  }

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

  it("renders event cards with enriched metadata", () => {
    render(<App />);
    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
    expect(screen.getByText("React Workshop - São Paulo")).toBeInTheDocument();
    expect(screen.getAllByText("Python Porto Alegre")[0]).toBeInTheDocument();
    expect(screen.getAllByText("In Person")[0]).toBeInTheDocument();
  });

  it("shows the total events count", () => {
    render(<App />);
    const resultsInfo = screen.getByText(/Showing/);
    expect(resultsInfo.textContent).toContain("8");
    expect(resultsInfo.textContent).toContain("events");
  });

  it("switches between list and map views", () => {
    render(<App />);

    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Map" }));

    expect(document.querySelector(".leaflet-container")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "List" }));

    expect(
      screen.getByText("Python Meetup - Porto Alegre"),
    ).toBeInTheDocument();
  });

  it("filters events by search term", () => {
    render(<App />);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Search events, places, formats, or hashtags...",
      ),
      { target: { value: "python" } },
    );

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

  it("filters events by state", () => {
    render(<App />);
    fireEvent.change(screen.getByDisplayValue("All States / Provinces"), {
      target: { value: "Rio Grande do Sul" },
    });

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

  it("filters events by hashtag", () => {
    render(<App />);
    fireEvent.change(screen.getByDisplayValue("All Hashtags"), {
      target: { value: "docker" },
    });

    expect(
      screen.getByText("DevOps Meetup - Belo Horizonte"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Python Meetup - Porto Alegre"),
    ).not.toBeInTheDocument();
  });

  it("filters events by event format", () => {
    render(<App />);
    fireEvent.change(screen.getByDisplayValue("All Formats"), {
      target: { value: "online" },
    });

    expect(
      screen.getByText("DevOps Meetup - Belo Horizonte"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Rust Programming Intro - São Paulo"),
    ).not.toBeInTheDocument();
  });

  it("filters events by cost", () => {
    render(<App />);
    fireEvent.change(screen.getByDisplayValue("All Costs"), {
      target: { value: "paid" },
    });

    expect(screen.getByText("React Workshop - São Paulo")).toBeInTheDocument();
    expect(
      screen.getByText("Data Science Bootcamp - Rio de Janeiro"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("DevOps Meetup - Belo Horizonte"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state when no events match", () => {
    render(<App />);
    fireEvent.change(
      screen.getByPlaceholderText(
        "Search events, places, formats, or hashtags...",
      ),
      { target: { value: "xyznonexistentevent" } },
    );

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

  it("filters events by customDate using date ranges", () => {
    render(<App />);
    setDateFilter("customDate");

    fireEvent.change(screen.getByLabelText("Custom date"), {
      target: { value: "2026-04-13" },
    });

    expect(
      screen.getByText("UX Design Workshop - Porto Alegre"),
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
});
