import { useEffect } from "react";
import {
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_LOCALE,
  SOCIAL_IMAGE,
  absoluteUrl,
} from "../../utils/seoHelpers";

function upsertMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
  return tag;
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  return link;
}

/**
 * Declarative <head> manager.
 *
 * This app is a single-page app that swaps views without navigation, so the
 * document title, meta description, canonical URL, and social cards have to be
 * kept in sync by hand. Doing it here keeps every route's metadata in one place
 * instead of scattered `document.title` assignments.
 *
 * Structured data (`jsonLd`) is injected as a JSON-LD script so crawlers can
 * render rich results for the events listed on the board.
 */
export default function Seo({
  title = DEFAULT_TITLE,
  description,
  path = "/",
  type = "website",
  image = SOCIAL_IMAGE,
  noindex = false,
  jsonLd = null,
}) {
  const url = absoluteUrl(path);
  // Serialised so the effect only re-runs when the data actually changes,
  // not on every parent render.
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    document.title = title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description || "",
    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow",
    });
    upsertCanonical(url);

    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description || "",
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: url,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: SITE_LOCALE,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description || "",
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });
  }, [title, description, url, type, image, noindex]);

  useEffect(() => {
    const id = "structured-data";
    document.getElementById(id)?.remove();

    if (!jsonLdText) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = jsonLdText;
    document.head.appendChild(script);

    return () => script.remove();
  }, [jsonLdText]);

  return null;
}
