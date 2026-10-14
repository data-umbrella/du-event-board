export const getEventStatus = (eventDate) => {
  if (!eventDate) return "none";

  const now = new Date();
  const event = new Date(eventDate + "T00:00:00");

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    event.getFullYear(),
    event.getMonth(),
    event.getDate(),
  );

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "ended";
  if (diffDays === 0) return "live";
  if (diffDays > 0 && diffDays <= 3) return "upcoming";

  return "none";
};

/**
 * Transforms github.com blob URLs into raw.githubusercontent.com URLs
 * to prevent third-party cookie warnings in Chrome for public assets.
 */
export const formatImageUrl = (url) => {
  if (!url) return url;

  if (
    url.includes("github.com") &&
    (url.includes("/blob/") || url.includes("?raw=true"))
  ) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
      .replace("?raw=true", "");
  }

  return url;
};
