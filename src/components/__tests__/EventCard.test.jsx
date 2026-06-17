import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EventCard from "../EventCard";

// Mock getEventStatus since it relies on current dates which might change
vi.mock("../../utils/eventHelpers", () => ({
  getEventStatus: vi.fn(() => "upcoming"),
}));

const mockEvent = {
  id: "123",
  title: "Test Meetup",
  description: "A great meetup",
  category: "Tech",
  date: "2025-10-15",
  start_time: "14:00",
  end_time: "16:00",
  location: "Online",
  paid_or_free: "free",
  tags: ["react", "testing"],
};

describe("EventCard Component", () => {
  it("renders correctly in grid mode", () => {
    render(
      <EventCard event={mockEvent} viewMode="grid" onSelectEvent={() => {}} />,
    );
    expect(screen.getByText("Test Meetup")).toBeInTheDocument();
    expect(screen.getByText("A great meetup")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("#testing")).toBeInTheDocument();
  });

  it("renders correctly in list mode", () => {
    render(
      <EventCard event={mockEvent} viewMode="list" onSelectEvent={() => {}} />,
    );
    expect(screen.getByText("Test Meetup")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.queryByText("A great meetup")).not.toBeInTheDocument(); // Description not in list
  });

  it("renders correctly with an end_date but no time (like PyOhio conference)", () => {
    const multiDayEvent = {
      ...mockEvent,
      end_date: "2025-10-16",
    };
    delete multiDayEvent.start_time;
    delete multiDayEvent.end_time;
    delete multiDayEvent.time;

    render(
      <EventCard
        event={multiDayEvent}
        viewMode="grid"
        onSelectEvent={() => {}}
      />,
    );
    // Should display just the dates without times
    expect(
      screen.getByText("October 15, 2025 – October 16, 2025"),
    ).toBeInTheDocument();
  });

  it("calls onSelectEvent when clicked (grid view)", () => {
    const handleSelect = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        viewMode="grid"
        onSelectEvent={handleSelect}
      />,
    );

    // The article is clickable
    const card = screen.getByRole("article");
    fireEvent.click(card);
    expect(handleSelect).toHaveBeenCalledWith("123");
  });

  it("calls onSelectEvent when title link is clicked (list view)", () => {
    const handleSelect = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        viewMode="list"
        onSelectEvent={handleSelect}
      />,
    );

    const titleLink = screen.getByText("Test Meetup");
    fireEvent.click(titleLink);
    expect(handleSelect).toHaveBeenCalledWith("123");
  });

  it("renders gracefully when tags and paid_or_free are missing", () => {
    const sparseEvent = {
      id: "456",
      title: "Sparse Meetup",
      date: "2025-11-01",
      category: "Tech",
    };
    render(
      <EventCard
        event={sparseEvent}
        viewMode="grid"
        onSelectEvent={() => {}}
      />,
    );
    expect(screen.getByText("Sparse Meetup")).toBeInTheDocument();
    // Free icon/text should not be displayed
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("renders correctly with only a generic time field instead of start/end times", () => {
    const timeEvent = {
      ...mockEvent,
      time: "19:00",
    };
    delete timeEvent.start_time;
    delete timeEvent.end_time;
    render(
      <EventCard event={timeEvent} viewMode="grid" onSelectEvent={() => {}} />,
    );
    // Format should fallback to date • time
    expect(screen.getByText("October 15, 2025 • 19:00")).toBeInTheDocument();
  });

  it("renders gracefully when date is empty or malformed", () => {
    const badDateEvent = {
      ...mockEvent,
      date: "",
      time: "",
    };
    render(
      <EventCard
        event={badDateEvent}
        viewMode="grid"
        onSelectEvent={() => {}}
      />,
    );
    expect(screen.getByText("Test Meetup")).toBeInTheDocument();
  });

  it("stops propagation when clicking the title link in grid view", () => {
    const handleSelect = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        viewMode="grid"
        onSelectEvent={handleSelect}
      />,
    );

    const titleLink = screen.getByText("Test Meetup");
    fireEvent.click(titleLink);
    // Should be called only once
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("123");
  });
});
