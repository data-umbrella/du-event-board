/*
 * icsGenerator.js
 * Supported time formats:
 *   - 24-hour: "18:00", "09:30", "00:00"
 *   - 12-hour: "6:00 PM", "12:00 AM", "12:30 PM"
 */

/**
 * Parses a time string (12-hour or 24-hour) into hours and minutes.
 *
 * @param {string} timeStr - e.g. "18:00" or "6:30 PM"
 * @returns {{ hours: number, minutes: number }}
 */
export function parseTime(timeStr) {
  const str = timeStr.trim();

  // 12-hour format: "6:30 PM", "12:00 AM", "12:30 pm"
  const twelveHour = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const meridiem = twelveHour[3].toUpperCase();

    if (meridiem === "AM") {
      // 12:xx AM → midnight hour (0)
      if (hours === 12) hours = 0;
    } else {
      // 12:xx PM → stays 12; others add 12
      if (hours !== 12) hours += 12;
    }

    return { hours, minutes };
  }

  // 24-hour format: "18:00", "00:00", "9:05"
  const twentyFourHour = str.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return {
      hours: parseInt(twentyFourHour[1], 10),
      minutes: parseInt(twentyFourHour[2], 10),
    };
  }

  throw new Error(`Unrecognised time format: "${timeStr}"`);
}

/**
 * Formats a date string and time string into an ICS datetime token (local time, no Z).
 *
 * @param {string} dateStr - ISO date "YYYY-MM-DD"
 * @param {string} timeStr - "HH:MM" or "H:MM AM/PM"
 * @returns {string} - e.g. "20260501T180000"
 */
export function formatICSDate(dateStr, timeStr) {
  const { hours, minutes } = parseTime(timeStr);
  const datePart = dateStr.replace(/-/g, ""); // "2026-05-01" → "20260501"
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${datePart}T${hh}${mm}00`;
}

/**
 * Escapes text for safe embedding in an ICS file per RFC 5545 §3.3.11.
 * Escapes: backslash, comma, semicolon, and newlines.
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeICSText(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\") // backslash first — must come before others
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Generates a complete RFC 5545-compliant ICS calendar string for a single event.
 * Uses CRLF (\\r\\n) line endings as required by the spec.
 *
 * @param {Object} event - Event object from events.json
 * @param {number} [durationHours=1] - Event duration in hours (default 1)
 * @returns {string} - Full ICS file content
 */
export function generateICS(event, durationHours = 1) {
  const CRLF = "\r\n";

  const dtStart = formatICSDate(event.date, event.time || "00:00");

  // Compute DTEND by adding durationHours to the parsed start time
  const { hours, minutes } = parseTime(event.time || "00:00");
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  const datePart = event.date.replace(/-/g, "");
  const dtEnd = `${datePart}T${String(endHours).padStart(2, "0")}${String(
    endMins,
  ).padStart(2, "0")}00`;

  // Stable UID using event id + date so re-imports don't duplicate calendar entries
  const uid = `du-event-${event.id}-${event.date}@data-umbrella`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Data Umbrella//DU Event Board//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description || "")}`,
    `LOCATION:${escapeICSText(event.location || "")}`,
    event.url ? `URL:${event.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join(CRLF);

  // Trailing CRLF required by RFC 5545
  return lines + CRLF;
}

/**
 * Triggers a browser download of a .ics file for the given event.
 *
 * @param {Object} event - Event object from events.json
 * @param {number} [durationHours=1] - Event duration in hours
 */
export function downloadICS(event, durationHours = 1) {
  const icsContent = generateICS(event, durationHours);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  // Sanitise the title for use as a filename
  const safeName = (event.title || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  link.download = `${safeName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL to free memory
  URL.revokeObjectURL(url);
}
