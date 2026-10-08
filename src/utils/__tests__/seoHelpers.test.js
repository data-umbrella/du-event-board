import { describe, it, expect } from "vitest";
import {
  DEFAULT_TITLE,
  SITE_URL,
  absoluteUrl,
  buildEventJsonLd,
  buildEventListJsonLd,
  buildWebSiteJsonLd,
  resolvePageMeta,
} from "../seoHelpers";

const event = {
  id: "7",
  title: "Rust Programming Intro - São Paulo",
  description: "Introduction to the Rust programming language.",
  date: "2026-04-18",
  time: "18:00",
  location: "Hacker House SP, Rua Augusta 2690",
  city: "São Paulo",
  state: "São Paulo",
  country: "Brazil",
  region: "South America",
  category: "Technology",
  url: "https://example.com/rust-intro-sp",
  tags: ["rust", "programming"],
  lat: -23.5506507,
  lng: -46.6333824,
  paid_or_free: "free",
};

describe("absoluteUrl", () => {
  it("keeps absolute URLs untouched", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("prefixes relative paths with the site origin", () => {
    expect(absoluteUrl("/?page=about")).toBe(`${SITE_URL}/?page=about`);
    expect(absoluteUrl("?page=about")).toBe(`${SITE_URL}/?page=about`);
  });
});

describe("buildEventJsonLd", () => {
  it("maps an event to a schema.org/Event node", () => {
    const node = buildEventJsonLd(event);

    expect(node["@type"]).toBe("Event");
    expect(node.name).toBe(event.title);
    expect(node.startDate).toBe("2026-04-18T18:00");
    expect(node.keywords).toEqual(["Technology", "rust", "programming"]);
    expect(node.location.address.addressLocality).toBe("São Paulo");
    expect(node.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: -23.5506507,
      longitude: -46.6333824,
    });
    expect(node.url).toBe(`${SITE_URL}/?page=event-details&eventId=7`);
  });

  it("returns null for an event without a title", () => {
    expect(buildEventJsonLd({ id: "1" })).toBeNull();
  });

  it("omits the offers block for paid events rather than guessing a price", () => {
    const node = buildEventJsonLd({
      ...event,
      paid_or_free: "paid",
    });
    expect(node.offers).toBeUndefined();
  });

  it("marks a free event with a zero-price offer", () => {
    expect(buildEventJsonLd(event).offers.price).toBe("0");
  });
});

describe("buildEventListJsonLd", () => {
  it("builds an ItemList with positional entries", () => {
    const list = buildEventListJsonLd([event, { ...event, id: "8" }]);

    expect(list["@type"]).toBe("ItemList");
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      item: { "@type": "Event" },
    });
    expect(list.itemListElement[1].position).toBe(2);
  });

  it("skips entries with no title", () => {
    const list = buildEventListJsonLd([event, { id: "9" }]);
    expect(list.numberOfItems).toBe(1);
  });
});

describe("buildWebSiteJsonLd", () => {
  it("links the site to the organization that publishes it", () => {
    const site = buildWebSiteJsonLd();
    expect(site["@type"]).toBe("WebSite");
    expect(site.publisher["@id"]).toBe(`${SITE_URL}/#organization`);
  });
});

describe("resolvePageMeta", () => {
  it("returns the default metadata for the events board", () => {
    expect(resolvePageMeta({ currentPage: "events" }).title).toBe(
      DEFAULT_TITLE,
    );
  });

  it("builds a title from an unknown page slug", () => {
    expect(resolvePageMeta({ currentPage: "code-of-conduct" }).title).toBe(
      "Code Of Conduct | DU Event Board",
    );
  });

  it("uses the event title and description on the details page", () => {
    const meta = resolvePageMeta({
      currentPage: "event-details",
      selectedEvent: event,
    });

    expect(meta.title).toBe(
      "Rust Programming Intro - São Paulo | DU Event Board",
    );
    expect(meta.description).toBe(event.description);
    expect(meta.type).toBe("article");
    expect(meta.path).toBe("?page=event-details&eventId=7");
  });

  it("falls back to the board metadata when the event is missing", () => {
    const meta = resolvePageMeta({
      currentPage: "event-details",
      selectedEvent: null,
    });
    expect(meta.title).toBe(DEFAULT_TITLE);
  });
});
