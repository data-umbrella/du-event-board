import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EventDetails from "../EventDetails";

const mockEvent = {
  id: "1",
  title: "Global Summit",
  description: "A very large summit.",
  date: "2025-12-01",
  end_date: "2025-12-03",
  location: "Convention Center",
  city: "New York",
  category: "Conference",
  tags: ["tech", "networking"],
  paid_or_free: "paid",
  url: "https://example.com",
};

describe("EventDetails Component", () => {
  it("returns null if no event is provided", () => {
    const { container } = render(
      <EventDetails event={null} onBack={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders event details correctly", () => {
    render(<EventDetails event={mockEvent} onBack={() => {}} />);

    // Check main elements
    expect(screen.getByText("Global Summit")).toBeInTheDocument();
    expect(screen.getByText("A very large summit.")).toBeInTheDocument();
    expect(screen.getByText("Conference")).toBeInTheDocument(); // Category badge
    expect(screen.getByText("Paid")).toBeInTheDocument(); // Cost badge
    expect(screen.getByText("#tech")).toBeInTheDocument();
    expect(screen.getByText("#networking")).toBeInTheDocument();

    // Check sidebar info
    expect(
      screen.getByText("December 1, 2025 – December 3, 2025"),
    ).toBeInTheDocument();
    expect(screen.getByText("Convention Center")).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const handleBack = vi.fn();
    render(<EventDetails event={mockEvent} onBack={handleBack} />);

    const backBtn = screen.getByRole("button", { name: /Back to Events/i });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("does not render the map if coords are missing", () => {
    render(<EventDetails event={mockEvent} onBack={() => {}} />);
    expect(screen.queryByText("Event Map Location")).not.toBeInTheDocument();
  });
});
