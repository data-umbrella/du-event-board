import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../App";

const structuredData = () => {
  const script = document.getElementById("structured-data");
  return script ? JSON.parse(script.textContent) : null;
};

describe("accessibility and SEO wiring", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    cleanup();
    document.getElementById("structured-data")?.remove();
  });

  it("renders without localStorage available", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      value: undefined,
      configurable: true,
    });

    try {
      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByRole("status")).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "localStorage", descriptor);
    }
  });

  it("renders a skip link as the first focusable control", () => {
    render(<App />);
    const skipLink = screen.getByRole("link", {
      name: "Skip to main content",
    });
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(document.querySelector("#main-content")).toBeInTheDocument();
  });

  it("announces the result count in a live region", () => {
    render(<App />);
    expect(screen.getByRole("status").textContent).toMatch(
      /^\d+ events match the current filters$/,
    );
  });

  it("updates the live region when filters change", () => {
    render(<App />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Search events by name, description, or tags...",
      ),
      { target: { value: "xyznonexistentevent" } },
    );

    expect(screen.getByRole("status").textContent).toBe(
      "0 events match the current filters",
    );
  });

  it("exposes the board as an ItemList of Events in structured data", () => {
    render(<App />);

    const data = structuredData();
    const itemList = data["@graph"].find(
      (node) => node["@type"] === "ItemList",
    );
    const site = data["@graph"].find((node) => node["@type"] === "WebSite");

    expect(site.url).toBe("https://events.dataumbrella.org/");
    expect(itemList.numberOfItems).toBeGreaterThan(0);
    expect(itemList.itemListElement[0].item["@type"]).toBe("Event");
  });

  it("swaps in a single Event node on the details page", () => {
    render(<App />);

    fireEvent.click(screen.getByText("Python Meetup - Porto Alegre"));

    const data = structuredData();
    expect(data["@type"]).toBe("Event");
    expect(data.name).toBe("Python Meetup - Porto Alegre");
    expect(document.title).toBe(
      "Python Meetup - Porto Alegre | DU Event Board",
    );
  });

  it("updates title and description when navigating between pages", () => {
    render(<App />);
    expect(document.title).toBe("DU Event Board - Discover Events Near You");

    fireEvent.click(screen.getByRole("link", { name: "About Us" }));
    expect(document.title).toBe("DU Event Board - About");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        .getAttribute("href"),
    ).toBe("https://events.dataumbrella.org/?page=about");
  });

  it("gives every event card a crawlable link", () => {
    render(<App />);
    const link = screen.getAllByRole("link", {
      name: "Python Meetup - Porto Alegre",
    })[0];
    expect(link).toHaveAttribute("href", "?page=event-details&eventId=1");
  });
});
