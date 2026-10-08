import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Seo from "../Seo";

const metaContent = (selector) =>
  document.head.querySelector(selector)?.getAttribute("content");

describe("Seo", () => {
  beforeEach(() => {
    document.head
      .querySelectorAll("[data-seo-test]")
      .forEach((n) => n.remove());
  });

  afterEach(() => {
    document.getElementById("structured-data")?.remove();
  });

  it("sets the document title", () => {
    render(<Seo title="Python Meetup | DU Event Board" />);
    expect(document.title).toBe("Python Meetup | DU Event Board");
  });

  it("writes description, robots, and canonical tags", () => {
    render(
      <Seo description="Find tech events near you." path="/?page=about" />,
    );

    expect(metaContent('meta[property="og:description"]')).toBe(
      "Find tech events near you.",
    );
    expect(metaContent('meta[name="robots"]')).toBe("index, follow");
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    ).toBe("https://events.dataumbrella.org/?page=about");
  });

  it("marks the page noindex when requested", () => {
    render(<Seo noindex />);
    expect(metaContent('meta[name="robots"]')).toBe("noindex, nofollow");
  });

  it("emits Open Graph and Twitter card tags", () => {
    render(<Seo title="About" description="About the board" />);

    expect(metaContent('meta[property="og:title"]')).toBe("About");
    expect(metaContent('meta[property="og:type"]')).toBe("website");
    expect(metaContent('meta[property="og:site_name"]')).toBe(
      "DU Event Board",
    );
    expect(metaContent('meta[name="twitter:card"]')).toBe(
      "summary_large_image",
    );
  });

  it("injects JSON-LD structured data as a single script tag", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Python Meetup",
    };
    render(<Seo jsonLd={jsonLd} />);

    const script = document.getElementById("structured-data");
    expect(script).toHaveAttribute("type", "application/ld+json");
    expect(JSON.parse(script.textContent)).toEqual(jsonLd);
  });

  it("does not emit a structured data script when none is given", () => {
    render(<Seo title="No data" />);
    expect(document.getElementById("structured-data")).toBeNull();
  });

  it("removes the structured data script on unmount", () => {
    const { unmount } = render(
      <Seo jsonLd={{ "@type": "WebSite", name: "DU Event Board" }} />,
    );
    expect(document.getElementById("structured-data")).not.toBeNull();

    unmount();
    expect(document.getElementById("structured-data")).toBeNull();
  });
});
