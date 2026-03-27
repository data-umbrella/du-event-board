export function parseISODate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function formatEventDateRange(startDate, endDate) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate || startDate);

  if (!start || !end) return "Date unavailable";

  const formatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString("en-US", {
      weekday: "short",
      ...formatOptions,
    });
  }

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return `${start.toLocaleDateString("en-US", formatOptions)} - ${end.toLocaleDateString(
    "en-US",
    formatOptions,
  )}`;
}

export function eventOverlapsRange(event, rangeStart, rangeEnd) {
  const eventStart = parseISODate(event.start_date || event.date);
  const eventEnd = parseISODate(event.end_date || event.start_date || event.date);

  if (!eventStart || !eventEnd) return false;
  if (rangeStart && eventEnd < rangeStart) return false;
  if (rangeEnd && eventStart > rangeEnd) return false;

  return true;
}

export function getEventStatus(startDate, endDate) {
  if (!startDate) return "none";

  const today = startOfDay(new Date());
  const eventStart = parseISODate(startDate);
  const eventEnd = parseISODate(endDate || startDate);

  if (!eventStart || !eventEnd) return "none";
  if (eventEnd < today) return "ended";
  if (eventStart <= today && eventEnd >= today) return "live";

  const diffTime = eventStart - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 3) return "upcoming";

  return "none";
}
