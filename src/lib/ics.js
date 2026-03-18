function escapeIcsText(value = "") {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatDateForIcs(date, time) {
  const compactDate = date.replaceAll("-", "");

  if (!time) {
    return `${compactDate}`;
  }

  const [hours = "00", minutes = "00"] = time.split(":");
  return `${compactDate}T${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
}

function formatDateTimeForIcs(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}00`;
}

export function createIcsContent(savedEvents) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DU Event Board//My Event Planner//EN",
    "CALSCALE:GREGORIAN",
  ];

  savedEvents.forEach((event) => {
    const startDate = new Date(`${event.date}T${event.time || "00:00"}:00`);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@du-event-board`);
    lines.push(`DTSTAMP:${formatDateForIcs(event.date, event.time)}`);
    lines.push(`DTSTART:${formatDateTimeForIcs(startDate)}`);
    lines.push(`DTEND:${formatDateTimeForIcs(endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    if (event.url) {
      lines.push(`URL:${escapeIcsText(event.url)}`);
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
