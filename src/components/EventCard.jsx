function formatEventTime(date, time, timezone) {
  if (!date || !time) {
    return "TBD";
  }

  if (!timezone) {
    return time; // backward compatible
  }

  // Use event datetime in the event timezone
  const eventDatetimeIso = `${date}T${time}:00`;

  // Interpret the same instant in event timezone
  const eventDate = new Date(eventDatetimeIso);

  // fallback for invalid Date
  if (Number.isNaN(eventDate.valueOf())) {
    return time;
  }

  const eventFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const localFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const eventTime = eventFormatter.format(eventDate);
  const localTime = localFormatter.format(eventDate);

  const timezoneName = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  })
    .formatToParts(eventDate)
    .find((part) => part.type === "timeZoneName")?.value;

  return timezoneName
    ? `${localTime} (${eventTime} ${timezoneName})`
    : `${localTime} (${eventTime} ${timezone})`;
}

export default function EventCard({ event }) {
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <article className="event-card" id={`event-${event.id}`}>
      <span className="event-card__category">{event.category}</span>
      <h2 className="event-card__title">{event.title}</h2>
      <p className="event-card__description">{event.description}</p>

      <div className="event-card__meta">
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">🕐</span>
          <span>{formatEventTime(event.date, event.time, event.timezone)}</span>
        </div>
        <div className="event-card__meta-item">
          <span className="event-card__meta-icon">📍</span>
          <span>{event.location}</span>
        </div>
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="event-card__tags">
          {event.tags.map((tag) => (
            <span key={tag} className="event-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {event.url && (
        <a
          href={event.url}
          className="event-card__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
          <span className="event-card__link-arrow">→</span>
        </a>
      )}
    </article>
  );
}
