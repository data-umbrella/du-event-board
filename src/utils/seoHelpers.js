export const SITE_NAME = "DU Event Board";
export const SITE_URL = "https://events.dataumbrella.org";
export const SITE_LOCALE = "en_US";
export const DEFAULT_TITLE = `${SITE_NAME} - Discover Events Near You`;
export const DEFAULT_DESCRIPTION =
  "DU Event Board - Discover tech events, meetups, and workshops near " +
  "your region. Find community events in Porto Alegre, São Paulo, " +
  "Curitiba, and more.";
export const SOCIAL_IMAGE = `${SITE_URL}/DU_logo.png`;

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Data Umbrella",
  url: "https://www.dataumbrella.org/",
  logo: SOCIAL_IMAGE,
  description:
    "A global non-profit community for underrepresented persons in " +
    "data science.",
};

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function toIsoDate(value) {
  if (!value) return undefined;
  const datePart = String(value).split("T")[0].split(" ")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : undefined;
}

function trimToLength(value, max) {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

/**
 * Turns one board event into a schema.org/Event node so search engines can
 * surface it as a rich result instead of plain text.
 */
export function buildEventJsonLd(event, { pathPrefix = "/" } = {}) {
  if (!event || !event.title) return null;

  const startDate = toIsoDate(event.date || event.start_date);
  const endDate = toIsoDate(event.end_date) || startDate;
  const times = event.start_time || event.time;
  const startDateTime =
    startDate && times ? `${startDate}T${times}` : startDate || undefined;

  const locationParts = [
    event.location,
    event.city,
    event.state || event.province,
    event.country,
  ].filter(Boolean);

  const keywords = [
    ...new Set([event.category, ...(event.tags || [])]),
  ].filter(Boolean);
  const isFree = event.paid_or_free?.toLowerCase() === "free";

  const node = {
    "@type": "Event",
    "@id": `${absoluteUrl(`${pathPrefix}?page=event-details&eventId=${event.id}`)}#event`,
    name: event.title,
    url: absoluteUrl(`${pathPrefix}?page=event-details&eventId=${event.id}`),
    description: trimToLength(event.description, 300),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.virtual === "Yes"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    organizer: { "@id": `${SITE_URL}/#organization` },
    ...(startDate ? { startDate: startDateTime } : {}),
    ...(endDate && endDate !== startDate ? { endDate } : {}),
    ...(locationParts.length
      ? {
          location: {
            "@type": "Place",
            name: locationParts[0],
            address: {
              "@type": "PostalAddress",
              streetAddress: event.location || undefined,
              addressLocality: event.city || undefined,
              addressRegion: event.state || event.province || undefined,
              addressCountry: event.country || undefined,
            },
          },
        }
      : {}),
    ...(Number.isFinite(event.lat) && Number.isFinite(event.lng)
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: event.lat,
            longitude: event.lng,
          },
        }
      : {}),
    ...(keywords.length ? { keywords } : {}),
    ...(isFree
      ? {
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            price: "0",
            priceCurrency: "USD",
            url: absoluteUrl(
              `${pathPrefix}?page=event-details&eventId=${event.id}`,
            ),
            validFrom: startDate || undefined,
          },
        }
      : {}),
  };

  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  );
}

/** Wraps a list of events in an ItemList node, which is what Google reads
 *  for carousel-style results. */
export function buildEventListJsonLd(events = [], { pathPrefix = "/" } = {}) {
  const items = events
    .map((event, index) => buildEventJsonLd(event, { pathPrefix }))
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} events`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      item: item,
    })),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

const PAGE_TITLES = {
  events: DEFAULT_TITLE,
  about: `${SITE_NAME} - About`,
  sponsors: `${SITE_NAME} - Sponsors`,
  "event-details": DEFAULT_TITLE,
};

const PAGE_DESCRIPTIONS = {
  events: DEFAULT_DESCRIPTION,
  about:
    "About the DU Event Board, a Data Umbrella initiative built with open " +
    "source software to share data science events with the community.",
  sponsors: `Meet the organizations that support ${SITE_NAME}.`,
  "event-details": DEFAULT_DESCRIPTION,
};

function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Single source of truth for per-route document metadata, replacing the
 * ad-hoc `document.title` assignments that used to live in App.jsx.
 */
export function resolvePageMeta({ currentPage, selectedEvent } = {}) {
  const page = currentPage || "events";

  if (page === "event-details") {
    if (selectedEvent?.title) {
      return {
        title: `${selectedEvent.title} | ${SITE_NAME}`,
        description: trimToLength(
          selectedEvent.description || DEFAULT_DESCRIPTION,
          160,
        ),
        path: `?page=event-details&eventId=${selectedEvent.id}`,
        type: "article",
      };
    }
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: "/",
      type: "website",
    };
  }

  const known = page in PAGE_TITLES;
  return {
    title: known ? PAGE_TITLES[page] : `${titleCase(page)} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTIONS[page] || DEFAULT_DESCRIPTION,
    path: page === "events" ? "/" : `?page=${page}`,
    type: "website",
  };
}

export { ORGANIZATION };
