import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BackToTop from "../BackToTop";

describe("BackToTop Component", () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  it("is hidden (not visible or opacity 0) when at the top of the page", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { name: /back to top/i });

    // Check that it has opacity: 0 or pointer-events: none in inline styles
    expect(button).toHaveStyle({ opacity: "0" });
  });

  it("renders with visible opacity when scrolled down past threshold", () => {
    render(<BackToTop />);

    window.scrollY = 350;
    fireEvent.scroll(window);

    const button = screen.getByRole("button", { name: /back to top/i });
    expect(button).toHaveStyle({ opacity: "1" });
  });

  it("scrolls back to top smoothly when clicked", () => {
    window.scrollTo = vi.fn();

    render(<BackToTop />);

    window.scrollY = 350;
    fireEvent.scroll(window);

    const button = screen.getByRole("button", { name: /back to top/i });
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });
});
it("handles mouse hover events correctly", () => {
  render(<BackToTop />);

  // Make button visible
  window.scrollY = 350;
  fireEvent.scroll(window);

  const button = screen.getByRole("button", { name: /back to top/i });

  // Trigger hover state
  fireEvent.mouseEnter(button);
  fireEvent.mouseLeave(button);

  expect(button).toBeInTheDocument();
});
