import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Header from "../Header";

describe("Header Component", () => {
  it("renders the brand name and tagline", () => {
    render(<Header theme="light" onToggleTheme={() => {}} />);
    expect(screen.getByText("DU Event Board")).toBeInTheDocument();
    expect(
      screen.getByText(/Discover tech events, meetups/),
    ).toBeInTheDocument();
  });

  it("calls onToggleTheme when the theme button is clicked", () => {
    const handleToggle = vi.fn();
    render(<Header theme="light" onToggleTheme={handleToggle} />);

    const toggleButton = screen.getByLabelText("Toggle Theme");
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("displays correct icon based on theme", () => {
    const { rerender } = render(
      <Header theme="light" onToggleTheme={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /Toggle Theme/i }),
    ).toHaveTextContent("🌙");

    rerender(<Header theme="dark" onToggleTheme={() => {}} />);
    expect(
      screen.getByRole("button", { name: /Toggle Theme/i }),
    ).toHaveTextContent("☀️");
  });

  it("calls onNavigate when events button is clicked", () => {
    const handleNavigate = vi.fn();
    render(
      <Header
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={handleNavigate}
      />,
    );

    const eventsButton = screen.getByText("Events");
    fireEvent.click(eventsButton);
    expect(handleNavigate).toHaveBeenCalledWith("events");
  });

  it("falls back to window.location.href when onNavigate is not provided", () => {
    // Save original location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: "http://localhost" };

    render(<Header theme="light" onToggleTheme={() => {}} />);

    const eventsButton = screen.getByText("Events");
    fireEvent.click(eventsButton);

    expect(window.location.href).toBe("/");

    // Restore location
    window.location = originalLocation;
  });
});
