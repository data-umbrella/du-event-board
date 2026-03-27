import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventCard from "./EventCard";

const baseEvent = {
  title: "Test Event",
  date: "2026-01-01",
  location: "Test Location",
};

describe("EventCard", () => {
  test("shows capacity when provided", () => {
    render(<EventCard event={{ ...baseEvent, capacity: 50 }} />);
    expect(screen.getByText(/50 spots/i)).toBeInTheDocument();
  });

  test("shows 'Unlimited' when no capacity", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
  });
});
